package com.marketplace.seller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerApplicationRepository extends JpaRepository<SellerApplication, UUID> {

    Optional<SellerApplication> findByEmail(String email);

    Optional<SellerApplication> findByInviteToken(String inviteToken);

    Page<SellerApplication> findByStatus(ApplicationStatus status, Pageable pageable);
}
