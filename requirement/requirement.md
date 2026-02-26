# SaaS File Management System

## Module Breakdown and Requirement Analysis

Prepared by: Rakibul Islam

---

## 1. System Overview

This project is a subscription-based SaaS platform where users manage folders and files under package-defined limits.

All actionable limits are dynamic and must come from database records managed by Admin (never hardcoded in business logic).

### 1.1 Primary Actors

- `Admin`
- `User`

### 1.2 Product Goal

Deliver a secure file/folder management system where:

- Admin controls package definitions and monitors usage.
- User performs storage operations within active subscription constraints.
- Business rules are enforced uniformly for every operation.

---

## 2. Scope and Rule Definitions

### 2.1 In Scope

- Authentication and authorization for Admin/User
- Package CRUD and package assignment
- File/folder operations with strict package enforcement
- Package switching behavior
- Admin usage monitoring

### 2.2 Out of Scope (for MVP)

- Billing/payment gateway integration
- Team workspaces and file sharing between users
- Version history and restore points
- Public links and permissioned file sharing

### 2.3 Core Rule Definitions

- `Max Folders`: Maximum number of folders per user (root + nested).
- `Max Nesting Level`: Maximum folder depth from root (root level = 1).
- `Allowed File Types`: Allowed MIME/extensions configured in package.
- `Max File Size`: Per-file max upload size in bytes.
- `Total File Limit`: Maximum number of files per user.
- `Files Per Folder`: Maximum number of files inside one folder.

---

## 3. Role and Permission Matrix

| Capability                       | Admin                                | User           |
| -------------------------------- | ------------------------------------ | -------------- |
| Register/Login                   | Optional seeded login + secure login | Register/Login |
| Manage package definitions       | Yes                                  | No             |
| Choose/Change own package        | No                                   | Yes            |
| Create/Rename/Delete folder      | No                                   | Yes            |
| Upload/View/Download/Rename file | No                                   | Yes            |
| View all users and usage         | Yes                                  | No             |
| Access own profile/subscription  | Yes (for self)                       | Yes (for self) |

---

## 4. Core Modules

### 4.1 Authentication Module

#### Functional Requirements

- Support secure login for both `ADMIN` and `USER` roles.
- User registration creates role `USER` by default.
- Password must be hashed (bcrypt/argon2).
- Protected routes require JWT bearer token.

#### Optional Enhancements

- Email verification flow
- Password reset via token/email

---

### 4.2 Subscription Package Module (Admin)

#### Functional Requirements

- Admin can `Create`, `Update`, `Delete`, and `View` packages.
- Package names supported in baseline seed:
  - `Free`
  - `Silver`
  - `Gold`
  - `Diamond`
- Package deletion must be restricted if currently used by active subscriptions.
- Every package must persist full limits in DB:
  - `maxFolders`
  - `maxNestingLevel`
  - `allowedFileTypes`
  - `maxFileSizeBytes`
  - `totalFileLimit`
  - `filesPerFolder`

#### Validation Rules

- Numeric limits must be positive integers.
- `allowedFileTypes` must be a non-empty list.
- Package name must be unique.

---

### 4.3 User Subscription Module

#### Functional Requirements

- User can view available packages.
- User can select one active package.
- User can switch package at any time.

#### Optional (Recommended)

- Persist subscription history:
  - `userId`
  - `packageId`
  - `startDate`
  - `endDate`
  - `status` (`ACTIVE`, `EXPIRED`, `SWITCHED`)

---

### 4.4 Folder Management Module

#### Functional Requirements

- Create root folder
- Create sub-folder
- Rename folder
- Delete folder
- List folder tree / list folder children

#### Mandatory Validations on Create

- Check user's current folder count against `maxFolders`.
- Check intended depth against `maxNestingLevel`.
- Prevent creating cycles (folder cannot be its own parent).

#### Deletion Behavior

- Recommended default: recursive delete for subtree metadata and stored files.
- If soft delete is used, all queries must exclude deleted data by default.

---

### 4.5 File Management Module

#### Functional Requirements

- Upload file
- View file list
- Download file
- Rename file
- Delete file

#### Supported Categories

- Image
- Video
- Audio
- PDF

#### Mandatory Validations on Upload

- File type allowed in package
- File size <= package max size
- User file count < package total file limit
- Files in target folder < package files-per-folder limit

#### Security Requirements

- Validate MIME type and extension together.
- Store files with generated safe filenames (no path traversal).
- Restrict download to owner (or authorized scope).

---

### 4.6 Enforcement Engine (Business Rule Layer)

#### Objective

Centralize all package-rule validations to ensure consistent behavior across controllers/services.

#### Must Validate Before Action

- `Folder Create`: folder count + nesting
- `File Upload`: file type + size + total file count + files per folder

#### Failure Behavior

- Reject operation with `4xx` error and clear reason code/message.
- No partial write should remain (transaction-safe behavior).

---

### 4.7 Package Switching Module

#### Required Behavior

- New package limits apply immediately after switch.
- Existing files/folders remain unchanged.
- Future create/upload actions must honor new limits.

#### Downgrade Rule

If current usage already exceeds new limits:

- Keep existing data
- Block only future actions that would increase violation
- Return explicit validation message with current vs allowed values

---

### 4.8 Admin Monitoring Module

#### Functional Requirements

- View all users (paginated)
- View each user's active package
- View usage snapshot:
  - folder count
  - file count
  - storage used (optional for MVP if file sizes tracked)
- Filter users by package

---

## 5. Database Design Modules

Recommended entities and core fields:

### 5.1 `users`

- `id` (PK)
- `name`
- `email` (unique)
- `passwordHash`
- `role` (`ADMIN` | `USER`)
- `createdAt`, `updatedAt`

### 5.2 `packages`

- `id` (PK)
- `name` (unique)
- `maxFolders`
- `maxNestingLevel`
- `allowedFileTypes` (JSON or related table)
- `maxFileSizeBytes`
- `totalFileLimit`
- `filesPerFolder`
- `createdAt`, `updatedAt`

### 5.3 `user_subscriptions`

- `id` (PK)
- `userId` (FK -> users)
- `packageId` (FK -> packages)
- `status`
- `startDate`
- `endDate` (nullable for active)
- `isActive` (or status-based active indicator)

### 5.4 `folders`

- `id` (PK)
- `userId` (FK -> users)
- `name`
- `parentId` (nullable FK -> folders.id)
- `depth`
- `createdAt`, `updatedAt`

### 5.5 `files`

- `id` (PK)
- `userId` (FK -> users)
- `folderId` (FK -> folders)
- `originalName`
- `storedName`
- `mimeType`
- `extension`
- `sizeBytes`
- `storagePath`
- `createdAt`, `updatedAt`

### Relationships

- One user -> many folders/files/subscriptions
- One package -> many user subscriptions
- One folder -> many child folders (self relation)
- One folder -> many files

---

## 6. Suggested API Module Map (Backend)

Base URL: `/api/v1`

### 6.1 Auth and User

- `POST /users/register`
- `POST /users/login`
- `GET /users/profile`
- `PATCH /users/profile`

### 6.2 Package (Admin)

- `POST /packages`
- `GET /packages`
- `GET /packages/:id`
- `PATCH /packages/:id`
- `DELETE /packages/:id`

### 6.3 Subscription

- `GET /subscriptions/packages` (public/authenticated user)
- `POST /subscriptions/select`
- `GET /subscriptions/current`
- `GET /subscriptions/history` (optional)

### 6.4 Folder

- `POST /folders`
- `GET /folders`
- `GET /folders/tree`
- `PATCH /folders/:id`
- `DELETE /folders/:id`

### 6.5 File

- `POST /files/upload`
- `GET /files`
- `GET /files/:id/download`
- `PATCH /files/:id`
- `DELETE /files/:id`

### 6.6 Admin Monitoring

- `GET /admin/users`
- `GET /admin/users/:id/usage`
- `GET /admin/overview`

---

## 7. Frontend Modules (`saas-storage-frontend`)

### 7.1 Admin Panel

- Secure login
- Package CRUD screens
- User list + package/usage monitoring

### 7.2 User Panel

- Register/Login
- Package selection and switch
- Folder tree management UI
- File upload/list/download/rename/delete UI
- Real-time validation feedback from API messages

---

## 8. Optional Extra Modules

- Email verification
- Password reset
- Package history timeline
- Usage analytics dashboard
- Storage quota usage by bytes/charts

---

## 9. System Rules Summary

| Action         | Validation                                                      |
| -------------- | --------------------------------------------------------------- |
| Folder Create  | Max Folder + Max Nesting Level                                  |
| File Upload    | File Type + Max File Size + Total File Limit + Files Per Folder |
| Package Switch | Immediate new limits; existing data untouched                   |

---

## 10. Acceptance Criteria (MVP)

- Admin can fully manage packages from DB-backed configs.
- User cannot bypass any package limit for folder/file actions.
- Package switch takes effect immediately for future operations.
- Existing data is preserved after package downgrade.
- Unauthorized access to protected routes is blocked.
- All key APIs return consistent response format and error messages.

---

## 11. Expected Deliverables

- Backend API (`saas-file-management-api`)
- Frontend UI (`saas-storage-frontend`)
- ER diagram for final DB design
- Deployed live URLs (backend + frontend)
- Admin credentials
- Test user credentials

---

End of module documentation.
