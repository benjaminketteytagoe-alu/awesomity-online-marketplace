package com.marketplace.product;

import com.marketplace.category.Category;
import com.marketplace.category.CategoryRepository;
import com.marketplace.common.exception.BadRequestException;
import com.marketplace.common.exception.ForbiddenException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.product.dto.CreateProductRequest;
import com.marketplace.product.dto.ProductResponse;
import com.marketplace.product.dto.UpdateProductRequest;
import com.marketplace.store.Store;
import com.marketplace.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;

    // ---------------- PUBLIC ----------------

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(UUID categoryId, UUID storeId, String q, Pageable pageable) {
        String cleaned = (q == null || q.isBlank()) ? null : q.trim();
        return productRepository.search(categoryId, storeId, cleaned, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(UUID id) {
        Product p = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        return toResponse(p);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> featured(Pageable pageable) {
        return productRepository.findByFeaturedTrueAndDeletedAtIsNull(pageable)
                .map(this::toResponse);
    }

    // ---------------- SELLER ----------------

    @Transactional(readOnly = true)
    public Page<ProductResponse> listForSeller(UUID sellerId, Pageable pageable) {
        Store store = requireStore(sellerId);
        return productRepository.findByStoreIdAndDeletedAtIsNull(store.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ProductResponse createForSeller(UUID sellerId, CreateProductRequest req) {
        Store store = requireStore(sellerId);

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new BadRequestException(
                        "CATEGORY_NOT_FOUND", "Category does not exist"));

        Product p = Product.builder()
                .store(store)
                .category(category)
                .name(req.name().trim())
                .description(req.description() == null ? null : req.description().trim())
                .price(req.price())
                .stock(req.stock())
                .featured(false)
                .build();
        productRepository.saveAndFlush(p);
        log.info("Product created id={} storeId={} sellerId={}", p.getId(), store.getId(), sellerId);
        return toResponse(p);
    }

    @Transactional
    public ProductResponse updateForSeller(UUID sellerId, UUID productId, UpdateProductRequest req) {
        Store store = requireStore(sellerId);
        Product p = requireOwnedProduct(productId, store.getId());

        if (req.name() != null) p.setName(req.name().trim());
        if (req.description() != null) p.setDescription(req.description().trim());
        if (req.price() != null) p.setPrice(req.price());
        if (req.stock() != null) p.setStock(req.stock());
        if (req.categoryId() != null) {
            Category c = categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new BadRequestException(
                            "CATEGORY_NOT_FOUND", "Category does not exist"));
            p.setCategory(c);
        }

        productRepository.saveAndFlush(p);
        return toResponse(p);
    }

    @Transactional
    public void softDeleteForSeller(UUID sellerId, UUID productId) {
        Store store = requireStore(sellerId);
        Product p = requireOwnedProduct(productId, store.getId());
        p.setDeletedAt(Instant.now());
        productRepository.save(p);
        log.info("Product soft-deleted id={} sellerId={}", productId, sellerId);
    }

    // ---------------- ADMIN ----------------

    @Transactional
    public ProductResponse setFeatured(UUID productId, boolean featured) {
        Product p = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        p.setFeatured(featured);
        productRepository.save(p);
        log.info("Product featured={} id={}", featured, productId);
        return toResponse(p);
    }

    @Transactional
    public void adminSoftDelete(UUID productId) {
        Product p = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        p.setDeletedAt(Instant.now());
        productRepository.save(p);
    }

    // ---------------- helpers ----------------

    private Store requireStore(UUID sellerId) {
        return storeRepository.findByOwnerId(sellerId)
                .orElseThrow(() -> new ForbiddenException(
                        "You don't have a store. Complete seller onboarding first."));
    }

    private Product requireOwnedProduct(UUID productId, UUID storeId) {
        Product p = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        if (!p.getStore().getId().equals(storeId)) {
            throw new ForbiddenException("Product belongs to a different store");
        }
        return p;
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getPrice(),
                p.getStock(),
                p.getFeatured(),
                p.getStore().getId(),
                p.getStore().getName(),
                p.getCategory().getId(),
                p.getCategory().getName(),
                p.getCategory().getSlug(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
