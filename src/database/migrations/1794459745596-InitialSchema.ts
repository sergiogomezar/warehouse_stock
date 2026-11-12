import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1794459745596 implements MigrationInterface {
  name = 'InitialSchema1794459745596';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."turnover" AS ENUM('HIGH', 'MEDIUM', 'LOW')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "sku" character varying(50) NOT NULL, "name" character varying(200) NOT NULL, "unit" character varying(20) NOT NULL, "turnover" "public"."turnover" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_products_sku" UNIQUE ("sku"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "warehouses" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" character varying(50) NOT NULL, "name" character varying(200) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_warehouses_code" UNIQUE ("code"), CONSTRAINT "PK_56ae21ee2432b2270b48867e4be" PRIMARY KEY ("id"))`,
    );
    // The "turnover" enum type created above is shared with shelves.zone;
    // the generator emitted a second CREATE TYPE here, removed by hand.
    await queryRunner.query(
      `CREATE TABLE "shelves" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "warehouse_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "zone" "public"."turnover" NOT NULL, "capacity" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_shelves_warehouse_code" UNIQUE ("warehouse_id", "code"), CONSTRAINT "CHK_shelves_capacity_positive" CHECK ("capacity" > 0), CONSTRAINT "PK_108bc01962c9c1c8726cef8fdd3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_items" ("shelf_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_stock_items_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_56f0a20a18478d4e1e4e0c2d187" PRIMARY KEY ("shelf_id", "product_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stock_movement_type" AS ENUM('RECEIVE', 'WITHDRAW', 'TRANSFER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "type" "public"."stock_movement_type" NOT NULL, "product_id" uuid NOT NULL, "from_shelf_id" uuid, "to_shelf_id" uuid, "quantity" integer NOT NULL, "note" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_stock_movements_shelves_match_type" CHECK (("type" = 'RECEIVE' AND "from_shelf_id" IS NULL AND "to_shelf_id" IS NOT NULL) OR ("type" = 'WITHDRAW' AND "from_shelf_id" IS NOT NULL AND "to_shelf_id" IS NULL) OR ("type" = 'TRANSFER' AND "from_shelf_id" IS NOT NULL AND "to_shelf_id" IS NOT NULL AND "from_shelf_id" <> "to_shelf_id")), CONSTRAINT "CHK_stock_movements_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_product_id" ON "stock_movements"  ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_from_shelf_id" ON "stock_movements"  ("from_shelf_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_to_shelf_id" ON "stock_movements"  ("to_shelf_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_created_at" ON "stock_movements"  ("created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "shelves" ADD CONSTRAINT "FK_2665ec69de8aad6d7fb5de73c67" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_items" ADD CONSTRAINT "FK_376fca66cbe7ef59616b90b5fcc" FOREIGN KEY ("shelf_id") REFERENCES "shelves"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_items" ADD CONSTRAINT "FK_7d35d70ec8771bb8c5f262d4d7f" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_0a364b295606bafda905022e4ce" FOREIGN KEY ("from_shelf_id") REFERENCES "shelves"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_71b5205a4e5ceae5ebaf0c9fc03" FOREIGN KEY ("to_shelf_id") REFERENCES "shelves"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_71b5205a4e5ceae5ebaf0c9fc03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_0a364b295606bafda905022e4ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_items" DROP CONSTRAINT "FK_7d35d70ec8771bb8c5f262d4d7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_items" DROP CONSTRAINT "FK_376fca66cbe7ef59616b90b5fcc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shelves" DROP CONSTRAINT "FK_2665ec69de8aad6d7fb5de73c67"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_stock_movements_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_stock_movements_to_shelf_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_stock_movements_from_shelf_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_stock_movements_product_id"`,
    );
    await queryRunner.query(`DROP TABLE "stock_movements"`);
    await queryRunner.query(`DROP TYPE "public"."stock_movement_type"`);
    await queryRunner.query(`DROP TABLE "stock_items"`);
    await queryRunner.query(`DROP TABLE "shelves"`);
    // "turnover" is still used by products here; it is dropped last.
    await queryRunner.query(`DROP TABLE "warehouses"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."turnover"`);
  }
}
