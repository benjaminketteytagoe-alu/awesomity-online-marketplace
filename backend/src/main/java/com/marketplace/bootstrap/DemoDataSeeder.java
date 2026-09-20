package com.marketplace.bootstrap;

import com.marketplace.category.Category;
import com.marketplace.category.CategoryRepository;
import com.marketplace.order.Order;
import com.marketplace.order.OrderItem;
import com.marketplace.order.OrderItemRepository;
import com.marketplace.order.OrderRepository;
import com.marketplace.order.OrderStatus;
import com.marketplace.product.Product;
import com.marketplace.product.ProductRepository;
import com.marketplace.store.Store;
import com.marketplace.store.StoreRepository;
import com.marketplace.user.User;
import com.marketplace.user.UserRepository;
import com.marketplace.user.UserRole;
import com.marketplace.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Seeds demo data on first startup.
 *
 * Runs only when the database has exactly 1 user (the auto-seeded
 * admin). Once any other user exists, this seeder is a no-op — safe
 * to leave enabled on every boot, including production demos.
 *
 * Order dependency on AdminSeeder is not enforced: if this seeder
 * runs first, count is 0, seeding proceeds, and AdminSeeder will
 * still create the admin user afterward (its own email check
 * prevents duplicates).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        long existingUsers = userRepository.count();
        if (existingUsers > 1) {
            log.info("DemoDataSeeder: {} users already present — skipping seed", existingUsers);
            return;
        }

        try {
            seed();
        } catch (Exception e) {
            log.error("DemoDataSeeder failed: {}", e.getMessage(), e);
        }
    }

    private void seed() {
        log.info("DemoDataSeeder: empty database detected — seeding demo data");

        // ---------- Categories ----------
        Category homeGarden = categoryRepository.save(Category.builder()
                .name("Home & Garden")
                .slug("home-garden")
                .description("Handcrafted and everyday homeware.")
                .build());
        Category electronics = categoryRepository.save(Category.builder()
                .name("Electronics")
                .slug("electronics")
                .description("Devices and accessories.")
                .build());

        // ---------- Sellers + stores ----------
        User carol = userRepository.save(User.builder()
                .email("carol@example.com")
                .passwordHash(passwordEncoder.encode("Seller123"))
                .name("Carol Seller")
                .role(UserRole.SELLER)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(Instant.now())
                .build());
        Store carolStore = storeRepository.save(Store.builder()
                .owner(carol)
                .name("Carol Crafts")
                .description("Small-batch handmade goods.")
                .build());

        User nordic = userRepository.save(User.builder()
                .email("nordic@example.com")
                .passwordHash(passwordEncoder.encode("Seller123"))
                .name("Nordic Home")
                .role(UserRole.SELLER)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(Instant.now())
                .build());
        Store nordicStore = storeRepository.save(Store.builder()
                .owner(nordic)
                .name("Nordic Home")
                .description("Scandinavian-inspired home goods.")
                .build());

        // ---------- Shopper ----------
        User benjamin = userRepository.save(User.builder()
                .email("benjamin@example.com")
                .passwordHash(passwordEncoder.encode("Shopper123"))
                .name("Benjamin Shopper")
                .role(UserRole.SHOPPER)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(Instant.now())
                .build());

        // ---------- Products ----------
        Product vase = productRepository.save(Product.builder()
                .store(carolStore)
                .category(homeGarden)
                .name("Handmade Ceramic Vase")
                .description("Hand-thrown stoneware vase with a matte glaze. " +
                        "Perfect for dried or fresh flowers. Approx 20cm tall.")
                .price(new BigDecimal("49.99"))
                .stock(12)
                .featured(true)
                .build());

        Product basket = productRepository.save(Product.builder()
                .store(carolStore)
                .category(homeGarden)
                .name("Woven Storage Basket")
                .description("Natural seagrass basket with a cotton liner.")
                .price(new BigDecimal("29.99"))
                .stock(8)
                .build());

        Product mug = productRepository.save(Product.builder()
                .store(carolStore)
                .category(homeGarden)
                .name("Speckled Stoneware Mug")
                .description("Dishwasher-safe mug with a comfortable rounded handle.")
                .price(new BigDecimal("14.50"))
                .stock(30)
                .build());

        productRepository.save(Product.builder()
                .store(nordicStore)
                .category(electronics)
                .name("Wireless Headphones")
                .description("Over-ear Bluetooth headphones with active noise " +
                        "cancelling and 30-hour battery life.")
                .price(new BigDecimal("199.00"))
                .stock(15)
                .featured(true)
                .build());

        productRepository.save(Product.builder()
                .store(nordicStore)
                .category(homeGarden)
                .name("Nordic Table Lamp")
                .description("Warm, dimmable LED lamp with an oak base and linen shade.")
                .price(new BigDecimal("79.00"))
                .stock(10)
                .build());

        productRepository.save(Product.builder()
                .store(nordicStore)
                .category(electronics)
                .name("Portable Bluetooth Speaker")
                .description("Water-resistant speaker with rich bass and 12-hour battery.")
                .price(new BigDecimal("89.50"))
                .stock(20)
                .build());

        // ---------- Sample order ----------
        Order order = orderRepository.save(Order.builder()
                .shopper(benjamin)
                .status(OrderStatus.PAID)
                .totalAmount(new BigDecimal("64.49"))
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(vase)
                .quantity(1)
                .unitPrice(new BigDecimal("49.99"))
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(mug)
                .quantity(1)
                .unitPrice(new BigDecimal("14.50"))
                .build());

        log.info("───────────────────────────────────────────────────────");
        log.info("  DEMO DATA SEEDED");
        log.info("  ─────────────────────────────────────────────────────");
        log.info("  Admin    admin@marketplace.local  (see ADMIN_PASSWORD)");
        log.info("  Seller   carol@example.com        Seller123");
        log.info("  Seller   nordic@example.com       Seller123");
        log.info("  Shopper  benjamin@example.com     Shopper123");
        log.info("───────────────────────────────────────────────────────");
    }
}
