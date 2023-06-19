import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';

import { validate as isUUID } from 'uuid'
import { ProductImage } from './entities/product-image.entity';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(

    // Se injecta la clase entidad
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) { }

  async create(createProductDto: CreateProductDto, user: User) {
    try {

      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) => this.productImageRepository.create({ url: image })),
        user
      });

      await this.productRepository.save(product); // se hace la insercion en la db

      return { ...product, images };

    } catch (error) {
      // console.log(error)

      this.handleDBExeption(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      }
    });

    return products.map(({ images, ...res }) => ({
      ...res,
      images: images.map(img => img.url)
    }))

  }

  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term })
    } else {
      // product = await this.productRepository.findOneBy({slug: term})

      //Crear consultas con querybuilder
      const queryBuilder = this.productRepository.createQueryBuilder('prod');

      // Buscar por titulo o por slug
      product = await queryBuilder
        .where(`UPPER(title) =:title or slug =:slug`, {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }
    // const product = await this.productRepository.findOneBy({ term });

    if (!product)
      throw new NotFoundException(`${term} no existe`);

    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term)
    return {
      ...rest,
      images: images.map(image => image.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
    });


    if (!product) throw new NotFoundException(`Producto con el id: ${id} no encontrado`);

    // Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } })

        product.images = images.map(
          (image) => this.productImageRepository.create({ url: image }))
      }

      product.user = user;
      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      // await this.productRepository.save(product);

      return this.findOnePlain(id);

    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExeption(error);
    }

  }

  async remove(id: string) {

    const resp = await this.productRepository.delete({ id });

    if (resp.affected === 0)
      throw new NotFoundException(`${id} no encontrado`);
  }

  private handleDBExeption(error: any) {
    if (error.code === '23505')
      throw new BadRequestException("Error ya existe", error.datail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handleDBExeption(error);
    }
  }
}
