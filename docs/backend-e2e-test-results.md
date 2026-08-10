# Backend E2E Test Results

Date: 2026-08-10 12:21:37
Base URL: http://localhost:4000/api/v1
Test run suffix: 1786344680

**TOTAL: 32 | PASS: 26 | FAIL: 6**

| # | Test | Result | Detail |
|---|---|---|---|
| 1 | P1 Admin Login | PASS | `HTTP 201` |
| 2 | P2 Create Role | PASS | `HTTP 201 role=4f77fdbe-4204-41ab-a84a-aca901442a37` |
| 3 | P2 List Permissions | PASS | `HTTP 200 count=19` |
| 4 | P3 Brand WF exists | PASS | `HTTP 200 id=1f3906b4-6fbe-43ca-b869-60c8a0222711` |
| 5 | P3 Vendor WF exists | PASS | `HTTP 200 id=5833e286-3094-4c74-97c5-f832034e89d4` |
| 6 | P3 Brand WF Step | PASS | `HTTP 201` |
| 7 | P3 Vendor WF Step | PASS | `HTTP 201` |
| 8 | P4 Brand Register | PASS | `HTTP 201` |
| 9 | P4 Get Brand ID | PASS | `brandId=83036c7e-0396-42ba-9759-c296e413442d` |
| 10 | P4 Brand Approve | FAIL | `HTTP 403 body={"statusCode":403,"message":"You are not the approver for this step","timestamp":"2026-08-10T06:51:25.927Z","path":"/api/v1/brands/83036c7e-0396-42ba-9759-c296e413442d/approve"}` |
| 11 | P4 Brand Login | FAIL | `HTTP 403 body={"statusCode":403,"message":"Your account is pending approval","timestamp":"2026-08-10T06:51:26.305Z","path":"/api/v1/brand-auth/login"}` |
| 12 | P5 Vendor Register | PASS | `HTTP 201` |
| 13 | P5 Get Vendor ID | PASS | `vendorId=679b736b-5d35-4b90-9cca-6433d9d631f9` |
| 14 | P5 Vendor Approve | FAIL | `HTTP 403 body={"statusCode":403,"message":"You are not the approver for this step","timestamp":"2026-08-10T06:51:28.167Z","path":"/api/v1/vendors/679b736b-5d35-4b90-9cca-6433d9d631f9/approve"}` |
| 15 | P5 Vendor Login | FAIL | `HTTP 403 body={"statusCode":403,"message":"Your account is pending approval","timestamp":"2026-08-10T06:51:28.385Z","path":"/api/v1/vendor-auth/login"}` |
| 16 | P6 Create Product | PASS | `HTTP 201 product=d49028fc-28ad-4b57-9869-57b574531e2a` |
| 17 | P6 Brand Rate Assign | PASS | `HTTP 201` |
| 18 | P7 Business Model | PASS | `HTTP 201` |
| 19 | P8 Create PO | PASS | `HTTP 201 po=9333ec37-c539-4f5f-a3a2-141f42621a04` |
| 20 | P12 Assign KAM | PASS | `HTTP 200` |
| 21 | P12 GET /dashboard/performance | PASS | `HTTP 200` |
| 22 | P12 GET /dashboard/sla-status | PASS | `HTTP 200` |
| 23 | P12 GET /alerts | PASS | `HTTP 200` |
| 24 | P13 GET /system/health | PASS | `HTTP 200` |
| 25 | P13 GET /system/error-logs | PASS | `HTTP 200` |
| 26 | P13 GET /system/email-logs | PASS | `HTTP 200` |
| 27 | P13 GET /system/sms-logs | PASS | `HTTP 200` |
| 28 | P14 brand Notifications | FAIL | `HTTP 401 body={"statusCode":401,"message":"Unauthorized","timestamp":"2026-08-10T06:51:34.347Z","path":"/api/v1/brand/notifications"}` |
| 29 | P14 vendor Notifications | FAIL | `HTTP 401 body={"statusCode":401,"message":"Unauthorized","timestamp":"2026-08-10T06:51:35.143Z","path":"/api/v1/vendor/notifications"}` |
| 30 | P15 Audit Logs | PASS | `HTTP 200 count=100` |
| 31 | P15 Audit Filter Brand | PASS | `HTTP 200` |
| 32 | P15 Audit Export | PASS | `HTTP 200 195 lines` |
