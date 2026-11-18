
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.request.SalesOrderRequest;
import com.bovsmart.jwt.dto.response.SaleEligibilityResponse;
import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.model.SalesOrder;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.repository.SalesOrderRepository;
import com.bovsmart.jwt.service.CattleService;
import com.bovsmart.jwt.service.SalesOrderService;
import com.bovsmart.jwt.service.AuditLogService;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class SalesOrderServiceImpl implements SalesOrderService {

    private static final String PENDING_APPROVAL = "PENDING_APPROVAL";
    private static final String APPROVED = "APPROVED";
    private static final String REJECTED = "REJECTED";

    private static final List<String> ACTIVE_ORDER_STATUSES =
            List.of(PENDING_APPROVAL, APPROVED, "COMPLETED");

    private final SalesOrderRepository salesOrderRepository;
    private final CattleRepository cattleRepository;
    private final CattleService cattleService;
    private final AuditLogService auditLogService;

    public SalesOrderServiceImpl(
            SalesOrderRepository salesOrderRepository,
            CattleRepository cattleRepository,
            CattleService cattleService,
            AuditLogService auditLogService) {

        this.salesOrderRepository = salesOrderRepository;
        this.cattleRepository = cattleRepository;
        this.cattleService = cattleService;
        this.auditLogService = auditLogService;
    }

    // STAFF / FARM_MANAGER lập phiếu xuất bán nhiều bò
    @Override
    public SalesOrder createSalesOrder(
            SalesOrderRequest request,
            String createdBy,
            String role) {

        if (createdBy == null || createdBy.isBlank()) {
            throw new IllegalArgumentException(
                    "Không xác định được người lập phiếu."
            );
        }

        if (!"STAFF".equals(role) && !"FARM_MANAGER".equals(role)) {
            throw new IllegalArgumentException(
                    "Bạn không có quyền lập phiếu xuất bán."
            );
        }

        if (request.getCattleIds() == null
                || request.getCattleIds().isEmpty()) {
            throw new IllegalArgumentException(
                    "Vui lòng chọn ít nhất một con bò."
            );
        }

        if (request.getBuyerName() == null
                || request.getBuyerName().isBlank()) {
            throw new IllegalArgumentException(
                    "Tên người mua không được để trống."
            );
        }

        if (request.getSaleDate() == null) {
            throw new IllegalArgumentException(
                    "Ngày xuất bán không được để trống."
            );
        }

        if (request.getPricePerKg() == null
                || request.getPricePerKg().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Đơn giá bán phải lớn hơn 0."
            );
        }

        // Không cho gửi trùng ID bò trong cùng một phiếu
        Set<String> uniqueCattleIds = new HashSet<>(request.getCattleIds());

        if (uniqueCattleIds.size() != request.getCattleIds().size()) {
            throw new IllegalArgumentException(
                    "Danh sách có mã bò bị trùng."
            );
        }

        List<SalesOrder.SalesOrderCattle> cattleDetails =
                new ArrayList<>();

        BigDecimal totalWeight = BigDecimal.ZERO;

        // Kiểm tra từng con bò
        for (String cattleId : request.getCattleIds()) {

            if (cattleId == null || cattleId.isBlank()) {
                throw new IllegalArgumentException(
                        "ID bò không được để trống."
                );
            }

            Cattle cattle = cattleRepository.findById(cattleId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Không tìm thấy bò có ID: " + cattleId
                            )
                    );

            // Kiểm tra phiếu đang xử lý hoặc đã được duyệt
            boolean hasOldActiveOrder =
                    salesOrderRepository.existsByCattleIdAndStatusIn(
                            cattle.getId(),
                            ACTIVE_ORDER_STATUSES
                    );

            boolean hasNewActiveOrder =
                    !salesOrderRepository
                            .findByCattleDetailsCattleIdInAndStatusIn(
                                    List.of(cattle.getId()),
                                    ACTIVE_ORDER_STATUSES
                            ).isEmpty();

            if (hasOldActiveOrder || hasNewActiveOrder) {
                throw new IllegalArgumentException(
                        "Bò " + cattle.getId()
                                + " đã có phiếu xuất bán đang xử lý hoặc đã được duyệt."
                );
            }

            if ("DA_XUAT_BAN".equalsIgnoreCase(cattle.getStatus())
                    || "SOLD".equalsIgnoreCase(cattle.getStatus())) {

                throw new IllegalArgumentException(
                        "Bò " + cattle.getId() + " đã được xuất bán."
                );
            }

            // Kiểm tra điều kiện xuất bán từ Backend
            SaleEligibilityResponse eligibility =
                    cattleService.checkSaleEligibility(cattle.getId());

            if (!eligibility.isEligible()) {
                throw new IllegalArgumentException(
                        "Bò " + cattle.getId()
                                + " chưa đủ điều kiện xuất bán: "
                                + eligibility.getMessage()
                );
            }

            if (cattle.getWeight() <= 0) {
                throw new IllegalArgumentException(
                        "Khối lượng của bò " + cattle.getId()
                                + " không hợp lệ."
                );
            }

            // Lưu thông tin từng bò tại thời điểm lập phiếu
            SalesOrder.SalesOrderCattle detail =
                    new SalesOrder.SalesOrderCattle(
                            cattle.getId(),
                            cattle.getEarTagNumber(),
                            cattle.getName(),
                            cattle.getWeight()
                    );

            cattleDetails.add(detail);

            totalWeight = totalWeight.add(
                    BigDecimal.valueOf(cattle.getWeight())
            );
        }

        // Tính tổng tiền của cả lô
        BigDecimal totalAmount = totalWeight
                .multiply(request.getPricePerKg())
                .setScale(2, RoundingMode.HALF_UP);

        SalesOrder order = new SalesOrder();

        order.setOrderCode(
                "SO-" + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase()
        );

        order.setCattleDetails(cattleDetails);

        // Giữ thông tin bò đầu tiên để tương thích dữ liệu cũ
        SalesOrder.SalesOrderCattle firstCattle = cattleDetails.get(0);

        order.setCattleId(firstCattle.getCattleId());
        order.setEarTagNumber(firstCattle.getEarTagNumber());
        order.setCattleName(firstCattle.getCattleName());
        order.setWeightAtSale(firstCattle.getWeightAtSale());

        order.setBuyerName(request.getBuyerName().trim());
        order.setBuyerPhone(request.getBuyerPhone());
        order.setBuyerAddress(request.getBuyerAddress());

        order.setSaleDate(request.getSaleDate());
        order.setPricePerKg(request.getPricePerKg());
        order.setTotalWeight(totalWeight);
        order.setTotalAmount(totalAmount);

        // Chỉ tạo phiếu chờ duyệt
        order.setStatus(PENDING_APPROVAL);
        order.setCreatedBy(createdBy);
        order.setNotes(request.getNotes());

        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        SalesOrder savedOrder = salesOrderRepository.save(order);

        Map<String, Object> details = new HashMap<>();
        details.put("orderCode", savedOrder.getOrderCode());
        details.put("cattleIds", request.getCattleIds());
        details.put("cattleCount", cattleDetails.size());
        details.put("totalWeight", totalWeight);
        details.put("totalAmount", totalAmount);

        auditLogService.createLog(
                createdBy,
                role,
                "SALES_ORDER_CREATED",
                "SALES_ORDER",
                savedOrder.getId(),
                "Lập phiếu xuất bán nhiều bò - Chờ quản lý phê duyệt",
                details
        );

        return savedOrder;
    }

    // FARM_MANAGER phê duyệt phiếu
    @Override
    public SalesOrder approveSalesOrder(
            String orderId,
            String approver,
            String role) {

        checkManagerRole(role);

        SalesOrder order = getSalesOrderById(orderId);

        if (!PENDING_APPROVAL.equals(order.getStatus())) {
            throw new IllegalArgumentException(
                    "Chỉ được phê duyệt phiếu đang chờ duyệt."
            );
        }

        // Không cho người lập tự phê duyệt
        if (order.getCreatedBy() != null
                && order.getCreatedBy().equalsIgnoreCase(approver)) {

            throw new IllegalArgumentException(
                    "Người lập phiếu không được tự phê duyệt phiếu của mình."
            );
        }

        List<SalesOrder.SalesOrderCattle> cattleDetails =
                order.getCattleDetails();

        // Hỗ trợ phiếu cũ chỉ có một cattleId
        if (cattleDetails == null || cattleDetails.isEmpty()) {

            if (order.getCattleId() == null
                    || order.getCattleId().isBlank()) {
                throw new IllegalArgumentException(
                        "Phiếu không có thông tin bò."
                );
            }

            cattleDetails = new ArrayList<>();

            Cattle oldCattle = cattleRepository
                    .findById(order.getCattleId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Không tìm thấy bò của phiếu xuất bán."
                            )
                    );

            cattleDetails.add(
                    new SalesOrder.SalesOrderCattle(
                            oldCattle.getId(),
                            oldCattle.getEarTagNumber(),
                            oldCattle.getName(),
                            order.getWeightAtSale()
                    )
            );
        }

        BigDecimal totalWeight = BigDecimal.ZERO;

        // Kiểm tra lại toàn bộ bò tại thời điểm phê duyệt
        List<Cattle> cattleToUpdate = new ArrayList<>();

        for (SalesOrder.SalesOrderCattle detail : cattleDetails) {

            Cattle cattle = cattleRepository.findById(detail.getCattleId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Không tìm thấy bò: " + detail.getCattleId()
                            )
                    );

            if ("DA_XUAT_BAN".equalsIgnoreCase(cattle.getStatus())
                    || "SOLD".equalsIgnoreCase(cattle.getStatus())) {

                throw new IllegalArgumentException(
                        "Bò " + cattle.getId() + " đã được xuất bán."
                );
            }

            SaleEligibilityResponse eligibility =
                    cattleService.checkSaleEligibility(cattle.getId());

            if (!eligibility.isEligible()) {
                throw new IllegalArgumentException(
                        "Không thể duyệt phiếu vì bò "
                                + cattle.getId()
                                + " không còn đủ điều kiện xuất bán: "
                                + eligibility.getMessage()
                );
            }

            if (Double.compare(
                    detail.getWeightAtSale(),
                    cattle.getWeight()) != 0) {

                throw new IllegalArgumentException(
                        "Khối lượng bò " + cattle.getId()
                                + " đã thay đổi. Không thể duyệt phiếu."
                );
            }

            // Không cho bò có phiếu khác đã được duyệt
            boolean hasOtherApprovedOrder =
                    salesOrderRepository.existsByCattleIdAndStatusIn(
                            cattle.getId(),
                            List.of(APPROVED, "COMPLETED")
                    );

            boolean hasOtherNewApprovedOrder =
                    salesOrderRepository
                            .findByCattleDetailsCattleIdInAndStatusIn(
                                    List.of(cattle.getId()),
                                    List.of(APPROVED, "COMPLETED")
                            )
                            .stream()
                            .anyMatch(existing ->
                                    !existing.getId().equals(order.getId())
                            );

            if (hasOtherApprovedOrder || hasOtherNewApprovedOrder) {
                throw new IllegalArgumentException(
                        "Bò " + cattle.getId()
                                + " đã nằm trong phiếu xuất bán khác được duyệt."
                );
            }

            totalWeight = totalWeight.add(
                    BigDecimal.valueOf(cattle.getWeight())
            );

            cattleToUpdate.add(cattle);
        }

        // Tính lại tổng tiền trước khi duyệt
        BigDecimal totalAmount = totalWeight
                .multiply(order.getPricePerKg())
                .setScale(2, RoundingMode.HALF_UP);

        // Cập nhật trạng thái bò sau khi toàn bộ kiểm tra hợp lệ
        for (Cattle cattle : cattleToUpdate) {
            cattle.setStatus("DA_XUAT_BAN");
            cattleRepository.save(cattle);
        }

        order.setCattleDetails(cattleDetails);
        order.setTotalWeight(totalWeight);
        order.setTotalAmount(totalAmount);

        order.setStatus(APPROVED);
        order.setApprovedBy(approver);
        order.setApprovedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        SalesOrder savedOrder = salesOrderRepository.save(order);

        Map<String, Object> details = new HashMap<>();
        details.put("orderCode", savedOrder.getOrderCode());
        details.put("cattleCount", cattleToUpdate.size());
        details.put("totalWeight", totalWeight);
        details.put("totalAmount", totalAmount);

        auditLogService.createLog(
                approver,
                role,
                "SALES_ORDER_APPROVED",
                "SALES_ORDER",
                savedOrder.getId(),
                "Quản lý phê duyệt phiếu xuất bán nhiều bò",
                details
        );

        return savedOrder;
    }

    // FARM_MANAGER từ chối phiếu
    @Override
    public SalesOrder rejectSalesOrder(
            String orderId,
            String rejectedBy,
            String reason,
            String role) {

        checkManagerRole(role);

        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập lý do từ chối phiếu."
            );
        }

        SalesOrder order = getSalesOrderById(orderId);

        if (!PENDING_APPROVAL.equals(order.getStatus())) {
            throw new IllegalArgumentException(
                    "Chỉ được từ chối phiếu đang chờ duyệt."
            );
        }

        if (order.getCreatedBy() != null
                && order.getCreatedBy().equalsIgnoreCase(rejectedBy)) {

            throw new IllegalArgumentException(
                    "Người lập phiếu không được tự từ chối phiếu của mình."
            );
        }

        order.setStatus(REJECTED);
        order.setRejectedBy(rejectedBy);
        order.setRejectedAt(LocalDateTime.now());
        order.setRejectionReason(reason.trim());
        order.setUpdatedAt(LocalDateTime.now());

        SalesOrder savedOrder = salesOrderRepository.save(order);

        Map<String, Object> details = new HashMap<>();
        details.put("orderCode", savedOrder.getOrderCode());
        details.put("cattleIds",
                savedOrder.getCattleDetails() == null
                        ? List.of(savedOrder.getCattleId())
                        : savedOrder.getCattleDetails()
                                .stream()
                                .map(SalesOrder.SalesOrderCattle::getCattleId)
                                .toList()
        );
        details.put("reason", reason.trim());

        auditLogService.createLog(
                rejectedBy,
                role,
                "SALES_ORDER_REJECTED",
                "SALES_ORDER",
                savedOrder.getId(),
                "Quản lý từ chối phiếu xuất bán",
                details
        );

        return savedOrder;
    }

    private void checkManagerRole(String role) {
        if (!"FARM_MANAGER".equals(role)) {
            throw new IllegalArgumentException(
                    "Chỉ Quản lý trang trại mới được duyệt hoặc từ chối phiếu."
            );
        }
    }

    // Lấy tất cả phiếu xuất bán
    @Override
    public List<SalesOrder> getAllSalesOrders() {
        return salesOrderRepository.findAll();
    }

    // Lấy chi tiết phiếu
    @Override
    public SalesOrder getSalesOrderById(String id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy phiếu xuất bán: " + id
                        )
                );
    }

    // Lấy lịch sử xuất bán theo bò
    @Override
    public List<SalesOrder> getSalesOrdersByCattleId(String cattleId) {

        List<SalesOrder> result =
                new ArrayList<>(
                        salesOrderRepository.findByCattleId(cattleId)
                );

        List<SalesOrder> newOrders =
                salesOrderRepository
                        .findByCattleDetailsCattleIdInAndStatusIn(
                                List.of(cattleId),
                                ACTIVE_ORDER_STATUSES
                        );

        for (SalesOrder order : newOrders) {
            if (result.stream().noneMatch(
                    existing -> existing.getId().equals(order.getId()))) {
                result.add(order);
            }
        }

        return result;
    }
}
