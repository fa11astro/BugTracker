package uni.bugtracker.backend.utility;

import org.springframework.stereotype.Component;
import uni.bugtracker.backend.dto.report.ReportCreationRequestWidget;
import uni.bugtracker.backend.dto.report.ReportUpdateRequestDashboard;
import uni.bugtracker.backend.exception.BusinessValidationException;
import uni.bugtracker.backend.model.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class ReportMapper {
    private static final int MAX_TAGS = 10;
    private static final int MAX_TITLE = 255;
    private static final int MAX_COMMENTS = 5000;

    public Report fromCreateOnWidget(
            ReportCreationRequestWidget request,
            Project project,
            Session session,
            byte[] screen
    ) {
        Report report = new Report();

        report.setProject(project);
        report.setSession(session);
        report.setTitle(trim(request.getTitle(), MAX_TITLE));

        // ignore unknown tags
        List<Tag> tags = request.getTags().stream()
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(s -> isValidEnum(Tag.class, s))
                .limit(MAX_TAGS)
                .map(Tag::valueOf)
                .collect(Collectors.toList());
        report.setTags(tags);

        report.setReportedAt(request.getReportedAt());
        report.setComments(trim(request.getComments(), MAX_COMMENTS));
        report.setUserEmail(request.getUserEmail());
        if (screen != null && screen.length > 0) {
            report.setScreen(screen);
        }
        report.setCurrentUrl(request.getCurrentUrl());
        report.setUserProvided(request.getUserProvided());
        report.setStatus(ReportStatus.NEW);

        return report;
    }

    public Report updateFromDashboard(Report report,
                                      ReportUpdateRequestDashboard request,
                                      Set<String> fields,
                                      Project project,
                                      Developer developer
    ) {
        if (fields.contains("projectId")) {
            report.setProject(project);
        }

        if (fields.contains("title")) {
            report.setTitle(trim(request.getTitle(), MAX_TITLE));
        }

        // ignore unknown tags
        if (fields.contains("tags")) {
            List<String> tags = request.getTags();
            report.setTags(tags == null ? null :
                    tags.stream()
                            .map(String::trim)
                            .map(String::toUpperCase)
                            .limit(MAX_TAGS)
                            .filter(this::isValidTag)
                            .map(Tag::valueOf)
                            .collect(Collectors.toList()));
        }

        if (fields.contains("reportedAt")) {
            if (request.getReportedAt() == null)
                throw new BusinessValidationException("INVALID_ARGUMENT", "reportedAt cannot be null");
            report.setReportedAt(request.getReportedAt());
        }

        if (fields.contains("comments")) {
            report.setComments(trim(request.getComments(), MAX_COMMENTS));
        }

        if (fields.contains("developerName")) {
            report.setDeveloper(developer);
        }

        if (fields.contains("level")) {
            report.setCriticality(request.getLevel());
        }

        if (fields.contains("status")) {
            if (request.getStatus() == null)
                throw new BusinessValidationException("INVALID_ARGUMENT", "status cannot be null");
            report.setStatus(request.getStatus());
        }

        if (fields.contains("userProvided")) {
            if (request.getUserProvided() == null)
                throw new BusinessValidationException("INVALID_ARGUMENT", "userProvided cannot be null");
            report.setUserProvided(request.getUserProvided());
        }
        return report;
    }

    public void attachEvents(Report report, List<Event> events) {
        report.setRelatedEventIds(
                events.stream()
                        .map(Event::getId)
                        .toList()
        );
    }

    private String trim(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    private <E extends Enum<E>> boolean isValidEnum(Class<E> enumClass, String value) {
        try {
            Enum.valueOf(enumClass, value);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private boolean isValidTag(String value) {
        try {
            Tag.valueOf(value);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}