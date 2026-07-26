package com.grainguard.backend.common;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Shared base for all JPA entities.
 *
 * Two deliberate design decisions worth knowing for your defense:
 *
 * 1. equals()/hashCode() are defined ONCE here, based on id only, instead of
 *    using Lombok's @Data on each entity. @Data generates equals/hashCode
 *    from every field, which is a well-known JPA footgun: it breaks with
 *    lazy-loaded proxies and bidirectional relationships, and can cause
 *    subtle bugs in Sets/Maps. Identity-based equality (same id = same
 *    entity) is the standard, safe approach for JPA entities.
 *
 * 2. createdAt/updatedAt are populated automatically by Spring Data JPA's
 *    auditing feature (@CreatedDate/@LastModifiedDate), which requires
 *    @EnableJpaAuditing — see JpaAuditingConfig.
 */
@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@EqualsAndHashCode(of = "id")
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
