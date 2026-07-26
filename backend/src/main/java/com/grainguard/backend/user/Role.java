package com.grainguard.backend.user;

/**
 * Kept as a simple enum rather than a separate `roles` table + join table.
 * A full many-to-many role system is real-world practice for large
 * applications with dynamically configurable permissions, but for three
 * fixed roles known at design time, an enum column is simpler, equally
 * correct, and much easier to reason about.
 */
public enum Role {
    ADMIN,
    MANAGER,
    VIEWER
}
