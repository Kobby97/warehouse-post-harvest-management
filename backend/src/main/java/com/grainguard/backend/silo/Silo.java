package com.grainguard.backend.silo;

import com.grainguard.backend.common.BaseEntity;
import com.grainguard.backend.warehouse.Warehouse;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * Deliberately a unidirectional @ManyToOne (Silo -> Warehouse), not a
 * bidirectional relationship with a @OneToMany list back on Warehouse.
 * Bidirectional JPA relationships add real complexity (cascade rules,
 * orphan removal, infinite-loop risk in toString/equals/JSON serialization)
 * for very little benefit here — if we need "all silos in a warehouse",
 * that's a simple repository query (see SiloRepository), not a Java
 * collection we have to keep in sync.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true, exclude = "warehouse")
@Entity
@Table(name = "silos")
public class Silo extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "grain_type", nullable = false, length = 30)
    private GrainType grainType;

    @Column(name = "capacity_kg", nullable = false)
    private Double capacityKg;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;
}
