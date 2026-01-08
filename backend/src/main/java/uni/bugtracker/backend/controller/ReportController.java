package uni.bugtracker.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.WebUtils;
import uni.bugtracker.backend.dto.report.ReportCardDTO;
import uni.bugtracker.backend.dto.report.ReportDashboardDTO;
import uni.bugtracker.backend.dto.report.ReportUpdateRequestDashboard;
import uni.bugtracker.backend.dto.report.ReportCreationRequestWidget;
import uni.bugtracker.backend.model.Tag;
import uni.bugtracker.backend.security.ProjectSecurity;
import uni.bugtracker.backend.service.ReportService;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // only for widget
    @PostMapping("/widget")
    public ResponseEntity<?> create(
            @Valid @RequestPart ReportCreationRequestWidget request,
            @RequestPart(required=false) MultipartFile screen) throws IOException {
        byte[] screenBytes = (screen != null && !screen.isEmpty()) ? screen.getBytes() : null;
        return new ResponseEntity<>(Map.of(
                "message", "Report created",
                "reportId", reportService.createReport(request, screenBytes)),
                HttpStatus.CREATED);
    }

    //    @PreAuthorize("isAuthenticated()")
    @PreAuthorize("@projectSecurity.hasAccessToProject(@reportService.getProjectIdByReportId(#id), authentication)")
    @PatchMapping("/{id}/dashboard")
    public ResponseEntity<ReportCardDTO> updateDev(
            @PathVariable Long id,
            @RequestBody ReportUpdateRequestDashboard request,
            HttpServletRequest httpRequest
    ) {
        String rawJson = getRawJson(httpRequest);
        return new ResponseEntity<>(
                reportService.updateReportFromDashboard(id, request, rawJson),
                HttpStatus.OK
        );
    }


    @PreAuthorize("@projectSecurity.hasAccessToProject(#projectId, authentication)")
    @GetMapping("/byProject/{projectId}")
    public ResponseEntity<Page<ReportDashboardDTO>> getAllByProject(
            @PathVariable String projectId,
            @PageableDefault(
                    page = 0,
                    size = 30,
                    sort = "reportedAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        HttpStatus responseStatus = HttpStatus.OK;
        Page<ReportDashboardDTO> listOfAllOnProject = reportService.getAllReportsOfProject(projectId, pageable);
        if (listOfAllOnProject.isEmpty()) {
            responseStatus = HttpStatus.NO_CONTENT;
        }
        return new ResponseEntity<>(listOfAllOnProject, responseStatus);
    }


    @PreAuthorize("@projectSecurity.hasAccessToProject(@reportService.getProjectIdByReportId(#reportId), authentication)")
    @GetMapping("/{reportId}")
    public ResponseEntity<ReportCardDTO> getReportCard(
            @PathVariable Long reportId
    ) {
        return new ResponseEntity<>(reportService.getReportCard(reportId), HttpStatus.OK);
    }

    @PreAuthorize("@projectSecurity.hasAccessToProject(@reportService.getProjectIdByReportId(#reportId), authentication)")
    @GetMapping("/{reportId}/screenshot")
    public ResponseEntity<byte[]> getScreenshot(@PathVariable Long reportId) {
        byte[] screen = reportService.getScreen(reportId);
        if (screen == null) {
            return ResponseEntity.notFound().build();
        }
        // define image MIME type
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        return ResponseEntity.ok().headers(headers).body(screen);
    }


    @PreAuthorize("@projectSecurity.hasAccessToProject(#projectId, authentication)")
    @GetMapping("/byProject/{projectId}/solved")
    public ResponseEntity<Page<ReportDashboardDTO>> getAllReportsSolved(
            @PageableDefault(
                    page = 0,
                    size = 30,
                    sort = "reportedAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable,
            @PathVariable String projectId
    ) {
        HttpStatus responseStatus = HttpStatus.OK;
        Page<ReportDashboardDTO> listOfSolved = reportService.getAllReportsSolvedOnProject(projectId, pageable);
        if (listOfSolved.isEmpty()) {
            responseStatus = HttpStatus.NO_CONTENT;
        }
        return new ResponseEntity<>(listOfSolved, responseStatus);
    }


    @PreAuthorize("@projectSecurity.hasAccessToProject(@reportService.getProjectIdByReportId(#id), authentication)")
    @DeleteMapping("/{id}")
    public ResponseEntity<ReportCardDTO> delete(@PathVariable Long id) {
        ReportCardDTO deletedReport = reportService.deleteReport(id);
        return new ResponseEntity<>(deletedReport, HttpStatus.OK);
    }

    @GetMapping("/tags")
    public ResponseEntity<List<String>> getTags() {
        List<String> tags = Arrays.stream(Tag.values())
                .map(Enum::name)
                .toList();
        return ResponseEntity.ok(tags);
    }

    private String getRawJson(HttpServletRequest request) {
        ContentCachingRequestWrapper wrapper =
                WebUtils.getNativeRequest(request, ContentCachingRequestWrapper.class);

        if (wrapper != null && wrapper.getContentAsByteArray().length > 0) {
            return new String(wrapper.getContentAsByteArray(), StandardCharsets.UTF_8);
        }
        return "{}";
    }
}