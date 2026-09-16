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

    @Query("""
        SELECT p FROM Product p
        WHERE p.deletedAt IS NULL
          AND (:categoryId IS NULL OR p.category.id = :categoryId)
          AND (:storeId IS NULL OR p.store.id = :storeId)
          AND (:q IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')))
        """)
    Page<Product> search(
        @Param("categoryId") UUID categoryId,
        @Param("storeId") UUID storeId,
        @Param("q") String q,
        Pageable pageable
    );
}
