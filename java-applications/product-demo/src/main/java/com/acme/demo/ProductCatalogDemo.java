package com.acme.demo;

import com.acme.products.Products;
import com.acme.products.config.ChaimConfig;

import java.time.Instant;
import java.util.UUID;

/**
 * Product Catalog Demo Application
 * 
 * This application demonstrates the Chaim-generated Java SDK that was created from
 * the product-catalog.bprint schema using the complete workflow:
 * 
 * 1. Define schema: schemas/product-catalog.bprint
 * 2. CDK synth: Creates LOCAL snapshot in ~/.chaim/cache/snapshots/
 * 3. chaim generate: Reads snapshot and generates Java SDK
 * 
 * <h2>Generated SDK Components:</h2>
 * <ul>
 *   <li>{@link Products} - Entity DTO with all fields from schema</li>
 *   <li>{@link ChaimConfig} - Configuration with table metadata</li>
 *   <li>ChaimMapperClient - Stub client for DynamoDB operations</li>
 * </ul>
 * 
 * <h2>Prerequisites:</h2>
 * <ol>
 *   <li>Run {@code ./scripts/synth-and-generate.sh} to generate the SDK</li>
 *   <li>Build the generated SDK: {@code cd generated-sdks/productcatalogstack-sdk && mvn package}</li>
 * </ol>
 * 
 * <h2>Running:</h2>
 * <pre>
 * cd java-applications/product-demo
 * mvn compile exec:java -Dexec.mainClass="com.acme.demo.ProductCatalogDemo"
 * </pre>
 * 
 * <h2>Note:</h2>
 * The generated mapper client has stub implementations. In a real application,
 * you would integrate with AWS SDK DynamoDB Enhanced Client.
 */
public class ProductCatalogDemo {

    public static void main(String[] args) {
        System.out.println();
        System.out.println("╔══════════════════════════════════════════════════════════════════╗");
        System.out.println("║           🛒 Product Catalog Demo - Chaim SDK Example            ║");
        System.out.println("╚══════════════════════════════════════════════════════════════════╝");
        System.out.println();

        ProductCatalogDemo demo = new ProductCatalogDemo();

        try {
            // Display configuration from generated SDK
            demo.showConfiguration();

            // Demonstrate entity creation using generated DTO
            demo.demonstrateEntityCreation();

            // Show validation
            demo.demonstrateValidation();

            System.out.println();
            System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            System.out.println("                     ✅ Demo Completed Successfully!");
            System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            System.out.println();

        } catch (Exception e) {
            System.err.println("❌ Error running demo: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    /**
     * Display SDK configuration from generated ChaimConfig.
     * These values come from the CDK stack metadata captured during synth.
     */
    private void showConfiguration() {
        System.out.println("📋 Generated SDK Configuration:");
        System.out.println("   Table Name: " + ChaimConfig.getTableName());
        System.out.println("   Table ARN:  " + ChaimConfig.getTableArn());
        System.out.println("   Region:     " + ChaimConfig.getRegion());
        System.out.println();
        System.out.println("   Note: Token values (${Token[...]}) are resolved at deploy time.");
        System.out.println();
    }

    /**
     * Demonstrate creating an entity using the generated Products DTO.
     * All fields from the .bprint schema are available as getters/setters.
     */
    private void demonstrateEntityCreation() {
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("            📝 Creating Product Entity from Schema");
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println();

        // Create a product using the generated DTO
        Products product = new Products();
        
        // Set primary key fields (from schema.entity.primaryKey)
        product.setProductId("PROD-" + UUID.randomUUID().toString().substring(0, 8));
        product.setCategory("Electronics");
        
        // Set other fields (from schema.entity.fields)
        product.setName("Chaim Smart Speaker");
        product.setDescription("AI-powered speaker demonstrating schema-driven development");
        product.setPrice(149.99);
        product.setStockQuantity(100.0);
        product.setIsActive(true);
        product.setCreatedAt(Instant.now());

        System.out.println("   ✓ Created product entity:");
        System.out.println("     - Product ID: " + product.getProductId());
        System.out.println("     - Category:   " + product.getCategory());
        System.out.println("     - Name:       " + product.getName());
        System.out.println("     - Price:      $" + product.getPrice());
        System.out.println("     - Stock:      " + product.getStockQuantity().intValue() + " units");
        System.out.println("     - Active:     " + product.getIsActive());
        System.out.println("     - Created:    " + product.getCreatedAt());
        System.out.println();

        // Show schema version
        System.out.println("   Schema Version: " + product.getChaimVersion());
        System.out.println();
    }

    /**
     * Demonstrate the built-in validation from the schema's required fields.
     */
    private void demonstrateValidation() {
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("             🔍 Demonstrating Schema Validation");
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println();

        // Create an incomplete product (missing required fields)
        Products incompleteProduct = new Products();
        incompleteProduct.setProductId("PROD-123");
        // Missing: category, name, price, stockQuantity, createdAt

        try {
            // The generated validate() method checks required fields from schema
            incompleteProduct.validate();
            System.out.println("   ❌ Validation should have failed!");
        } catch (IllegalArgumentException e) {
            System.out.println("   ✓ Validation correctly caught missing required field:");
            System.out.println("     " + e.getMessage());
        }

        System.out.println();
        System.out.println("   This validation is generated from the schema's 'required: true' fields.");
        System.out.println();
    }
}
