package com.grainguard.backend.common.response;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Wraps Spring Data's Page<T> into a simpler, stable shape for the frontend.
 * Spring's raw Page serialization exposes a lot of internal Pageable detail
 * that's irrelevant to API consumers — this keeps just what's actually useful.
 */
@Getter
@Builder
public class PagedResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static <T> PagedResponse<T> from(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
