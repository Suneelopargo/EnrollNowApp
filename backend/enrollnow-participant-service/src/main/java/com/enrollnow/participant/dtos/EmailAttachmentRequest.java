package com.enrollnow.participant.dtos;

public class EmailAttachmentRequest {
    private String fileName;
    private String fileUploadId;
    private String fileContentType;
    private String fileContentBase64;

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileUploadId() { return fileUploadId; }
    public void setFileUploadId(String fileUploadId) { this.fileUploadId = fileUploadId; }
    public String getFileContentType() { return fileContentType; }
    public void setFileContentType(String fileContentType) { this.fileContentType = fileContentType; }
    public String getFileContentBase64() { return fileContentBase64; }
    public void setFileContentBase64(String fileContentBase64) { this.fileContentBase64 = fileContentBase64; }
}
