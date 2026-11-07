package com.enrollnow.notification.templates;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class NotificationHtmlRenderer {

    private static final String BRAND_COLOR = "#004b87";
    private static final String BACKGROUND_COLOR = "#f8fafc";
    private static final String BORDER_COLOR = "#e2e8f0";

    public String renderDailyDigestHtml(String recipientName, String studyName, Map<String, Object> digestData, String labUrl) {
        StringBuilder sb = new StringBuilder();
        appendHeader(sb, "Daily Digest - " + studyName);

        sb.append("<p style=\"font-size: 15px; color: #1e293b; margin-bottom: 20px;\">")
          .append("Hello <strong>").append(escapeHtml(recipientName)).append("</strong>,<br>")
          .append("Here is your daily activity and schedule digest for study <strong>")
          .append(escapeHtml(studyName)).append("</strong>.</p>");

        // Overdue Tasks
        renderTaskSection(sb, "Overdue Tasks", (List<Map<String, Object>>) digestData.get("overdueTasks"), "#dc2626");

        // Tasks Due Today
        renderTaskSection(sb, "Tasks Due Today", (List<Map<String, Object>>) digestData.get("dueTodayTasks"), "#d97706");

        // Tasks Due Tomorrow
        renderTaskSection(sb, "Tasks Due Tomorrow", (List<Map<String, Object>>) digestData.get("dueTomorrowTasks"), "#2563eb");

        // Overdue Events
        renderEventSection(sb, "Overdue Events", (List<Map<String, Object>>) digestData.get("overdueEvents"), "#dc2626");

        // Events Today
        renderEventSection(sb, "Events Today", (List<Map<String, Object>>) digestData.get("eventsToday"), "#16a34a");

        // Events Tomorrow
        renderEventSection(sb, "Events Tomorrow", (List<Map<String, Object>>) digestData.get("eventsTomorrow"), "#2563eb");

        // Expected Events
        renderEventSection(sb, "Expected Events (Next 2 Weeks)", (List<Map<String, Object>>) digestData.get("expectedEvents"), "#6b7280");

        appendFooter(sb, labUrl);
        return sb.toString();
    }

    public String renderNotificationHtml(String title, String recipientName, String message, Map<String, String> details, String actionText, String actionUrl, String labUrl) {
        StringBuilder sb = new StringBuilder();
        appendHeader(sb, title);

        sb.append("<p style=\"font-size: 15px; color: #1e293b; margin-bottom: 16px;\">")
          .append("Hello <strong>").append(escapeHtml(recipientName)).append("</strong>,</p>")
          .append("<p style=\"font-size: 15px; color: #1e293b; margin-bottom: 24px;\">")
          .append(escapeHtml(message)).append("</p>");

        if (details != null && !details.isEmpty()) {
            sb.append("<table width=\"100%\" cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse: collapse; margin-bottom: 24px; border: 1px solid ")
              .append(BORDER_COLOR).append("; background-color: #ffffff; border-radius: 6px;\">");
            for (Map.Entry<String, String> entry : details.entrySet()) {
                sb.append("<tr>")
                  .append("<td width=\"35%\" style=\"font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid ").append(BORDER_COLOR).append("; background-color: #f1f5f9; padding: 10px 14px;\">")
                  .append(escapeHtml(entry.getKey())).append("</td>")
                  .append("<td style=\"font-size: 13px; color: #1e293b; border-bottom: 1px solid ").append(BORDER_COLOR).append("; padding: 10px 14px;\">")
                  .append(escapeHtml(entry.getValue())).append("</td>")
                  .append("</tr>");
            }
            sb.append("</table>");
        }

        if (actionText != null && actionUrl != null) {
            sb.append("<div style=\"text-align: center; margin: 28px 0;\">")
              .append("<a href=\"").append(escapeHtml(actionUrl)).append("\" target=\"_blank\" style=\"display: inline-block; background-color: ")
              .append(BRAND_COLOR).append("; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 4px;\">")
              .append(escapeHtml(actionText)).append("</a></div>");
        }

        appendFooter(sb, labUrl);
        return sb.toString();
    }

    private void renderTaskSection(StringBuilder sb, String heading, List<Map<String, Object>> items, String badgeColor) {
        if (items == null || items.isEmpty()) {
            return;
        }

        sb.append("<div style=\"margin-top: 24px; margin-bottom: 16px;\">")
          .append("<h3 style=\"font-size: 15px; font-weight: 600; color: ").append(badgeColor).append("; margin-bottom: 8px; border-bottom: 2px solid ")
          .append(badgeColor).append("; padding-bottom: 4px;\">")
          .append(heading).append(" (").append(items.size()).append(")</h3>")
          .append("<table width=\"100%\" cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse: collapse; font-size: 13px; border: 1px solid ").append(BORDER_COLOR).append(";\">")
          .append("<tr style=\"background-color: #f1f5f9; color: #475569; font-weight: 600; text-align: left;\">")
          .append("<th style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">Task Title</th>")
          .append("<th style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">Due Date</th>")
          .append("<th style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">Status</th>")
          .append("<th style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">Participant</th>")
          .append("<th style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">Assigned To</th>")
          .append("</tr>");

        for (Map<String, Object> item : items) {
            sb.append("<tr>")
              .append("<td style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append("; font-weight: 500;\">")
              .append(escapeHtml(String.valueOf(item.getOrDefault("name", "")))).append("</td>")
              .append("<td style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append("; color: #64748b;\">")
              .append(escapeHtml(String.valueOf(item.getOrDefault("dates", "")))).append("</td>")
              .append("<td style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">")
              .append("<span style=\"display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background-color: #e2e8f0; color: #334155;\">")
              .append(escapeHtml(String.valueOf(item.getOrDefault("status", "OPEN")))).append("</span></td>")
              .append("<td style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append("; color: #0284c7;\">")
              .append(escapeHtml(String.valueOf(item.getOrDefault("pCustomId", item.getOrDefault("pGlobalId", "-"))))).append("</td>")
              .append("<td style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append("; color: #64748b;\">")
              .append(escapeHtml(String.valueOf(item.getOrDefault("assignedTo", "-")))).append("</td>")
              .append("</tr>");
        }
        sb.append("</table></div>");
    }

    private void renderEventSection(StringBuilder sb, String heading, List<Map<String, Object>> items, String badgeColor) {
        if (items == null || items.isEmpty()) {
            return;
        }

        sb.append("<div style=\"margin-top: 24px; margin-bottom: 16px;\">")
          .append("<h3 style=\"font-size: 15px; font-weight: 600; color: ").append(badgeColor).append("; margin-bottom: 8px; border-bottom: 2px solid ")
          .append(badgeColor).append("; padding-bottom: 4px;\">")
          .append(heading).append(" (").append(items.size()).append(")</h3>")
          .append("<table width=\"100%\" cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse: collapse; font-size: 13px; border: 1px solid ").append(BORDER_COLOR).append(";\">")
          .append("<tr style=\"background-color: #f1f5f9; color: #475569; font-weight: 600; text-align: left;\">")
          .append("<th style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">Event Name</th>")
          .append("<th style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">Date</th>")
          .append("<th style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">Status</th>")
          .append("<th style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">Participant</th>")
          .append("</tr>");

        for (Map<String, Object> item : items) {
            sb.append("<tr>")
              .append("<td style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append("; font-weight: 500;\">")
              .append(escapeHtml(String.valueOf(item.getOrDefault("name", "")))).append("</td>")
              .append("<td style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append("; color: #64748b;\">")
              .append(escapeHtml(String.valueOf(item.getOrDefault("dates", "")))).append("</td>")
              .append("<td style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">")
              .append("<span style=\"display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background-color: #e2e8f0; color: #334155;\">")
              .append(escapeHtml(String.valueOf(item.getOrDefault("status", "SCHEDULED")))).append("</span></td>")
              .append("<td style=\"padding: 8px; border-bottom: 1px solid ").append(BORDER_COLOR).append("; color: #0284c7;\">")
              .append(escapeHtml(String.valueOf(item.getOrDefault("pCustomId", item.getOrDefault("pGlobalId", "-"))))).append("</td>")
              .append("</tr>");
        }
        sb.append("</table></div>");
    }

    private void appendHeader(StringBuilder sb, String title) {
        sb.append("<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>")
          .append("<body style=\"margin: 0; padding: 24px 0; background-color: ").append(BACKGROUND_COLOR)
          .append("; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;\">")
          .append("<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid ")
          .append(BORDER_COLOR).append("; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\">")
          .append("<tr><td style=\"background-color: ").append(BRAND_COLOR).append("; padding: 20px 28px; text-align: left;\">")
          .append("<div style=\"color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;\">EnrollNow</div>")
          .append("<div style=\"color: #93c5fd; font-size: 13px; margin-top: 4px;\">").append(escapeHtml(title)).append("</div>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding: 28px 28px 20px 28px;\">");
    }

    private void appendFooter(StringBuilder sb, String labUrl) {
        sb.append("</td></tr>")
          .append("<tr><td style=\"background-color: #f8fafc; border-top: 1px solid ").append(BORDER_COLOR)
          .append("; padding: 16px 28px; font-size: 12px; color: #64748b; text-align: center;\">")
          .append("This is an automated notification from <a href=\"").append(escapeHtml(labUrl != null ? labUrl : "#"))
          .append("\" style=\"color: ").append(BRAND_COLOR).append("; text-decoration: none; font-weight: 600;\">EnrollNow</a>.")
          .append("<br>To modify your notification preferences, visit <strong>My Account &gt; Studies, Roles, and Email Notifications</strong>.")
          .append("</td></tr></table></body></html>");
    }

    private String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}
