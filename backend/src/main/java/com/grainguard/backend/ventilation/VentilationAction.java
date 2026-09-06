package com.grainguard.backend.ventilation;

import com.grainguard.backend.alert.Alert;
import com.grainguard.backend.common.BaseEntity;
import com.grainguard.backend.silo.Silo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * A LOGGED decision only — no command is sent to real hardware. The ESP32
 * already handles its own instant local response (LED/buzzer) completely
 * independently of the backend. This record exists so the system has an
 * auditable trail of "here's what should have happened," which is the
 * agreed V1 scope rather than actual remote actuator control.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true, exclude = {"alert", "silo"})
@Entity
@Table(name = "ventilation_actions")
public class VentilationAction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id", nullable = false)
    private Alert alert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "silo_id", nullable = false)
    private Silo silo;

    @Column(nullable = false, length = 500)
    private String description;
}
