package com.bovsmart.jwt.dto.response;

public class VeterinaryStaffOption {

    private String id;
    private String fullName;
    private String email;
    private String department;

    public VeterinaryStaffOption() {
    }

    public VeterinaryStaffOption(
            String id,
            String fullName,
            String email,
            String department
    ) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.department = department;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}