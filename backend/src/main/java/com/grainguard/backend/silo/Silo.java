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
 * See SiloRepository for "all silos in a warehouse" queries instead.
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

    // Distance in cm from the mounted ultrasonic sensor down to the empty
    // silo floor. Used to convert a raw distance reading into a fill
    // percentage: fillPercentage = (heightCm - distanceCm) / heightCm * 100.
    // See FillLevelCalculator (M5).
    @Column(name = "height_cm", nullable = false)
    private Double heightCm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;
}
