import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity({name: 'product_images'}) // ponerle nombre a la tabla
export  class ProductImage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    url: string;

    @ManyToOne(
        () => Product,
        (product) => product.images,
        {onDelete: "CASCADE"}
    ) // de muchos a uno
    product: Product
}