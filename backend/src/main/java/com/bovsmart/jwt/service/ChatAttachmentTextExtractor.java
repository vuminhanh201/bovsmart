
package com.bovsmart.jwt.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

import java.util.Locale;

@Service
public class ChatAttachmentTextExtractor {

    private static final int MAX_TEXT_PER_FILE = 30000;

    public String extract(ChatAttachment attachment) {

        if (attachment == null
                || attachment.originalName() == null
                || attachment.bytes() == null
                || attachment.bytes().length == 0) {

            throw new IllegalArgumentException(
                    "Tệp đính kèm không hợp lệ!"
            );
        }

        String originalName = attachment.originalName();

        String name = originalName.toLowerCase(Locale.ROOT);

        byte[] bytes = attachment.bytes();

        try {

            String content;

            if (name.endsWith(".pdf")) {

                content = extractPdf(bytes);

            } else if (name.endsWith(".docx")) {

                content = extractDocx(bytes);

            } else if (name.endsWith(".xlsx")
                    || name.endsWith(".xls")) {

                content = extractExcel(bytes);

            } else if (name.endsWith(".csv")) {

                content = extractCsv(bytes);

            } else {

                return "";
            }

            if (content == null || content.isBlank()) {

                return "[Tệp " + originalName
                        + " không có nội dung văn bản đọc được.]";
            }

            if (content.length() > MAX_TEXT_PER_FILE) {

                content = content.substring(0, MAX_TEXT_PER_FILE)
                        + "\n[Đã giới hạn nội dung trích xuất.]";
            }

            return content;

        } catch (Exception e) {

            throw new IllegalArgumentException(
                    "Không thể đọc nội dung tệp: " + originalName,
                    e
            );
        }
    }

    // Đọc PDF
    private String extractPdf(byte[] bytes) throws IOException {

        try (var document = Loader.loadPDF(bytes)) {

            PDFTextStripper stripper = new PDFTextStripper();

            return stripper.getText(document);
        }
    }

    // Đọc Word DOCX
    private String extractDocx(byte[] bytes) throws IOException {

        StringBuilder result = new StringBuilder();

        try (XWPFDocument document = new XWPFDocument(
                new ByteArrayInputStream(bytes)
        )) {

            // Đọc các đoạn văn
            for (var paragraph : document.getParagraphs()) {

                String text = paragraph.getText();

                if (text != null && !text.isBlank()) {

                    appendLimited(result, text + "\n");

                }
            }

            // Đọc các bảng
            for (var table : document.getTables()) {

                for (var row : table.getRows()) {

                    for (var cell : row.getTableCells()) {

                        appendLimited(
                                result,
                                cell.getText() + " | "
                        );
                    }

                    appendLimited(result, "\n");
                }
            }
        }

        return result.toString();
    }

    // Đọc Excel XLSX và XLS
    private String extractExcel(byte[] bytes) throws IOException {

        StringBuilder result = new StringBuilder();

        DataFormatter formatter = new DataFormatter();

        try (Workbook workbook = WorkbookFactory.create(
                new ByteArrayInputStream(bytes)
        )) {

            for (int sheetIndex = 0;
                    sheetIndex < workbook.getNumberOfSheets();
                    sheetIndex++) {

                Sheet sheet = workbook.getSheetAt(sheetIndex);

                appendLimited(
                        result,
                        "\n--- Sheet: "
                                + sheet.getSheetName()
                                + " ---\n"
                );

                for (Row row : sheet) {

                    for (Cell cell : row) {

                        appendLimited(
                                result,
                                formatter.formatCellValue(cell) + " | "
                        );
                    }

                    appendLimited(result, "\n");

                    if (result.length() >= MAX_TEXT_PER_FILE) {
                        return result.substring(
                                0,
                                MAX_TEXT_PER_FILE
                        );
                    }
                }
            }
        }

        return result.toString();
    }

    // Đọc CSV UTF-8
    private String extractCsv(byte[] bytes) throws IOException {

        String content = StandardCharsets.UTF_8
                .newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(bytes))
                .toString();

        // Loại bỏ BOM nếu có
        if (content.startsWith("\uFEFF")) {

            content = content.substring(1);
        }

        return content;
    }

    // Thêm nội dung nhưng không vượt quá giới hạn
    private void appendLimited(
            StringBuilder result,
            String text
    ) {

        if (result.length() >= MAX_TEXT_PER_FILE) {
            return;
        }

        int remaining = MAX_TEXT_PER_FILE - result.length();

        if (text.length() > remaining) {

            result.append(text, 0, remaining);

        } else {

            result.append(text);
        }
    }
}
