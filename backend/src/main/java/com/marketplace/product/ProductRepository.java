package com.marketplace.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Page<Product> findByStoreIdAndDeletedAtIsNull(UUID storeId, Pageable pageable);

    Page<Product> findByCategoryIdAndDeletedAtIsNull(UUID categoryId, Pageable pageable);

    Page<Product> findByFeaturedTrueAndDeletedAtIsNull(Pageable pageable);

    Optional<Product> findByIdAndDeletedAtIsNull(UUID id);

    long countByCategoryIdAndDeletedAtIsNull(UUID categoryId);

    /** Count ALL products in a category, including soft-deleted. Used to guard category deletion. */
    long countByCategoryId(UUID categoryId);

    @Query("""
        SELECT p FROM Product p
        WHERE p.deletedAt IS NULL
          AND (CAST(:categoryId AS string) IS NULL OR p.category.id = :categoryId)
          AND (CAST(:storeId AS string) IS NULL OR p.store.id = :storeId)
          AND (CAST(:q AS string) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
        """)
    Page<Product> search(
        @Param("categoryId") UUID categoryId,
        @Param("storeId") UUID storeId,
        @Param("q") String q,
        Pageable pageable
    );

    /**
     * Atomically decrement stock if enough is available.
     * Returns the number of rows updated: 1 on success, 0 if insufficient stock.
     * This is our optimistic-concurrency primitive for order processing.
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("""
        UPDATE Product p
        SET p.stock = p.stock - :qty
        WHERE p.id = :productId
          AND p.deletedAt IS NULL
          AND p.stock >= :qty
        """)
    int decrementStockIfAvailable(
            @org.springframework.data.repository.query.Param("productId") UUID productId,
            @org.springframework.data.repository.query.Param("qty") int qty);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Product p SET p.stock = p.stock + :qty WHERE p.id = :productId")
    int incrementStock(
            @org.springframework.data.repository.query.Param("productId") UUID productId,
            @org.springframework.data.repository.query.Param("qty") int qty);
}
