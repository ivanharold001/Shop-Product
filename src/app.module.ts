import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Para configurar las variables de entorno
    TypeOrmModule.forRoot({ // Configurar typeORM
      type: 'postgres',
      host: process.env.BD_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true, // para que carge automáticamente las entidades
      synchronize: true, //  es opcinal para produccion
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ProductsModule, 
    CommonModule, 
    SeedModule, 
    FilesModule, AuthModule,
  ],
})
export class AppModule {}
