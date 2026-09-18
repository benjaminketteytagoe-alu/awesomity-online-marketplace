package com.marketplace.admin;

import com.marketplace.admin.dto.AdminStoreSummary;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.product.ProductRepository;
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
public class AdminStoreService {

    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<AdminStoreSummary> list(Pageable pageable) {
        return storeRepository.findByDeletedAtIsNull(pageable).map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public AdminStoreSummary get(UUID id) {
        Store store = storeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new NotFoundException("Store not found"));
        return toSummary(store);
    }

    @Transactional
    public void softDelete(UUID storeId) {
        Store store = storeRepository.findByIdAndDeletedAtIsNull(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found"));

        int affectedProducts = productRepository.softDeleteAllByStoreId(storeId);
        store.setDeletedAt(Instant.now());
        storeRepository.save(store);

        log.warn("Admin soft-deleted store {} ({} products cascaded)",
                storeId, affectedProducts);
    }

    private AdminStoreSummary toSummary(Store s) {
        long count = productRepository.countByStoreIdAndDeletedAtIsNull(s.getId());
        return new AdminStoreSummary(
                s.getId(),
                s.getName(),
                s.getDescription(),
                s.getOwner().getId(),
                s.getOwner().getEmail(),
                s.getOwner().getName(),
                count,
                s.getCreatedAt());
    }
}
