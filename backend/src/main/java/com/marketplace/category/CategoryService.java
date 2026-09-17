package com.marketplace.category;

import com.marketplace.category.dto.CategoryRequest;
import com.marketplace.category.dto.CategoryResponse;
import com.marketplace.common.SlugUtil;
import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(UUID id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));
        return toResponse(c);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getBySlug(String slug) {
        Category c = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Category not found"));
        return toResponse(c);
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        String name = req.name().trim();
        if (categoryRepository.existsByName(name)) {
            throw new ConflictException("CATEGORY_EXISTS", "A category with this name exists");
        }

        String slug = uniqueSlug(SlugUtil.slugify(name));
        Category c = Category.builder()
                .name(name)
                .slug(slug)
                .description(req.description() == null ? null : req.description().trim())
                .build();
        categoryRepository.save(c);
        log.info("Category created id={} slug={}", c.getId(), c.getSlug());
        return toResponse(c);
    }

    @Transactional
    public CategoryResponse update(UUID id, CategoryRequest req) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));

        String name = req.name().trim();
        if (!c.getName().equalsIgnoreCase(name) && categoryRepository.existsByName(name)) {
            throw new ConflictException("CATEGORY_EXISTS", "A category with this name exists");
        }

        // Regenerate slug only if name changed.
        if (!c.getName().equals(name)) {
            c.setSlug(uniqueSlug(SlugUtil.slugify(name)));
            c.setName(name);
        }
        c.setDescription(req.description() == null ? null : req.description().trim());

        categoryRepository.save(c);
        return toResponse(c);
    }

    @Transactional
    public void delete(UUID id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));

        // Refuse deletion if ANY product still references this category.
        // Note: we count soft-deleted products too — the DB FK doesn't care about
        // our deleted_at flag, and hard-deleting a referenced category would raise
        // a constraint violation.
        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new ConflictException("CATEGORY_IN_USE",
                    "Cannot delete category: " + productCount + " product(s) still reference it "
                    + "(including soft-deleted). Consider removing products first.");
        }

        categoryRepository.delete(c);
        log.info("Category deleted id={} slug={}", id, c.getSlug());
    }

    private String uniqueSlug(String base) {
        String slug = base.isEmpty() ? "category" : base;
        if (!categoryRepository.existsBySlug(slug)) return slug;
        int n = 2;
        while (categoryRepository.existsBySlug(slug + "-" + n)) n++;
        return slug + "-" + n;
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getDescription());
    }
}
