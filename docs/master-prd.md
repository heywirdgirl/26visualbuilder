
🚀 PRD MVP: 26visualbuilder (Tree-Based Lean MVP)
Trình quản lý cấu trúc UI dựa trên Cây Node → Trình tạo JSX sạch
Mục tiêu: Phác thảo giao diện web có cấu trúc chuẩn xác, tốc độ cao dành cho Developer, tập trung vào đầu ra JSX sạch chuẩn Shadcn.
1. 📌 Tổng quan sản phẩm
 * Tên sản phẩm: 26visualbuilder.
 * Loại sản phẩm: Ứng dụng Web phien ban v1 (Công cụ bổ trợ phát triển - Developer Tool).
 * Mục tiêu MVP: Xác thực tính khả dụng của việc dựng UI bằng quản lý Cây Node (Tree-node) và khả năng tạo mã nguồn JSX sạch.
 * Đầu ra chính: Mã JSX sạch, sử dụng Tailwind CSS và các thuộc tính (Props) chuẩn Shadcn.
 * Thời gian hoàn thiện v1: 4 tuần.
2. 🎯 Mục tiêu v1
Xác thực trực tiếp 2 giả định cốt lõi:
 * Developer có thể phác thảo cấu trúc và layout của website thông qua việc quản lý Cây Node (tương tự Godot/FlutterFlow) nhanh và chuẩn xác hơn việc gõ code tay từ đầu.
 * Mã JSX sinh ra đủ sạch, đúng tư duy Flexbox/Grid để mang vào IDE cá nhân tái sử dụng ngay lập tức mà không cần refactor (sửa lại cấu trúc).
3. 👤 Người dùng mục tiêu
 * Đối tượng chính: Lập trình viên độc lập (Indie Developer), Freelancer, Frontend Developer.
 * Nỗi đau (Pain): Ghét các công cụ kéo thả tự do vì sinh code bẩn (div soup) và dễ vỡ layout trên mobile. Nhưng nếu viết code layout tay từ đầu thì tốn thời gian, còn các công cụ vẽ mockup (Figma) thì quá trừu tượng, không ra được code thật.
 * Mong muốn: Dựng khung layout chuẩn Flexbox/Grid trong vài phút bằng tư duy của lập trình viên, cấu trúc tường minh, copy JSX là chạy được ngay.
4. 🎯 Phạm vi v1
 * Bao gồm (Sẽ làm):
   * Bảng quản lý Cây thư mục Node (Scene Tree) ở cánh trái (Thêm, xóa, đổi thứ tự cha-con của Node).
   * Bảng điều khiển Inspector nổi (Floating) ở cánh phải để sửa nội dung, thuộc tính Shadcn và map class Tailwind.
   *  ẩn toàn bộ Menu (Toggle Sidebar) để hiển thị trọn vẹn 100% giao diện trên Viewport máy của Dev.moi menu co 1 bien store stase rieng de chu dong dong mo theo y muon
   * Thư viện giới hạn 3 thành phần cốt lõi: Button, Card, Container.
   * Xem trước và sao chép mã nguồn JSX.
 * Loại trừ (Không làm trong MVP): Kéo thả (Drag & Drop) trên màn hình, Undo/Redo, phóng to/thu nhỏ (Zoom), ràng buộc logic/state cua project , lưu trữ đám mây (Cloud sync).
5. 🧱 Luồng người dùng chính (Core User Flow)
 * Mở ứng dụng, xuất hiện một Node Container gốc (Root) trên màn hình.
 * Tại bảng Cây Node bên trái, bấm nút thêm Node con (Ví dụ: Thêm một Container dạng Row, rồi thêm Button vào trong).
 * Click vào Node bất kỳ trên cây, bảng Inspector nổi bên phải xuất hiện.
 * Chỉnh sửa Variant của Shadcn hoặc chỉnh khoảng cách (Gap/Padding) của Container trong Inspector (hệ thống tự map ra class Tailwind).
 * nhan button menu ẩn tung Menu để kiểm tra giao diện hiển thị 100% thực tế trên trình duyệt.
 * Mở tab Code, sao chép đoạn JSX sạch và paste vào dự án Next.js/React cá nhân.
6. 🧩 Thành phần MVP (3 Block cốt lõi kiểu Godot Control Node)
 * Container (Tương tự VBox/HBoxContainer trong Godot): Dùng để chia bố cục. Thuộc tính Inspector: Hướng (Xếp dọc - flex-col / Xếp ngang - flex-row), Khoảng cách (gap), Đệm (padding), Căn lề (items-center, justify-between).
 * Button (Shadcn Button): Dùng cho hành động. Thuộc tính Inspector: Nội dung chữ (Children text), Biến thể (variant: default, destructive, outline, ghost), Kích thước (size: sm, default, lg).
 * Card (Shadcn Card): Dùng để cụm nội dung. Thuộc tính Inspector: Tiêu đề (Title), Mô tả (Description), Nội dung (Content).
7. 🧠 Tiêu chí thành công
 * Dev dựng được một Form đăng nhập hoặc một Topbar responsive chuẩn xác bằng Cây Node trong dưới 3 phút.
 * Code JSX sinh ra không chứa style inline tuyệt đối, sử dụng 100% class tiện ích của Tailwind.
🛠️ Editor Architecture (Pre-MVP)
> Nguyên tắc cốt lõi: Nói KHÔNG với thẻ HTML5 <canvas>. Toàn bộ vùng làm việc là React DOM thật. Không tính toán tọa độ pixel. Giao diện tuân thủ tuyệt đối dòng chảy tự nhiên của HTML (Flexbox & Grid).
> 
Vùng làm việc (Workspace & Viewport)
 * Sẽ làm:
   * Render các Component trực tiếp bằng React DOM trên cùng một cây thư mục với Editor để tối ưu hiệu năng (không dùng iframe).
   * Sử dụng cơ chế Shadow DOM hoặc Scoped CSS để bọc vùng hiển thị sản phẩm, đảm bảo CSS của hệ thống Editor không đè hoặc làm ảnh hưởng đến Tailwind CSS của component người dùng.
   * Các thanh menu điều khiển (Cây Node, Inspector) được thiết kế dưới dạng Menu Nổi (Floating Panels) hoặc có thể đóng/mở lập tức qua phím tắt.
   * Khi ẩn Menu, không gian hiển thị tự động giãn ra chiếm trọn 100% kích thước màn hình thật của Developer (Viewport thực tế), giúp kiểm tra tính Responsive tự nhiên của Tailwind.
 * Không làm:
   * Dùng thẻ <canvas> để vẽ pixel.
   * Dùng CSS transform: scale() để thu nhỏ màn hình (vì làm sai lệch Media Queries của Tailwind).
Quản lý Node (Thay thế cho Drag & Drop)
 * Sẽ làm:
   * Quản lý toàn bộ giao diện bằng một trạng thái cây dữ liệu duy nhất (JSON Component Tree lưu trong Zustand).
   * Mọi thao tác thay đổi vị trí, thứ tự xếp trước/sau, lồng node cha-con đều thực hiện thông qua tương tác click chuột/phím tắt trực tiếp trên bảng quản lý Cây Node (Sidebar trái).
   * Hệ thống bố cục hoạt động theo cơ chế Container-driven: Node cha quy định luật sắp xếp, các Node con tự động tuân thủ (ví dụ: flex-col thì tự động xếp dọc xuống).
 * Không làm:
   * Tự viết thuật toán kéo thả vị trí trên màn hình.
   * Tọa độ tuyệt đối top/left/X/Y.
Bảng thuộc tính (Inspector)
 * Sẽ làm:
   * Đọc thông tin của duy nhất Node đang được chọn (Active Node ID) từ Zustand State.
   * Ánh xạ (Map) trực tiếp các lựa chọn trực quan của người dùng thành code:
     * Chọn Align: Center \rightarrow Nạp class "items-center" vào Node.
     * Chọn Padding: 4 \rightarrow Nạp class "p-4" vào Node.
     * Chọn Variant: Outline \rightarrow Truyền prop variant="outline" vào Shadcn Button.
 * Không làm:
   * Cho phép người dùng viết code CSS inline tự do.
Hiển thị và Lựa chọn (Selection & Interaction)
 * Sẽ làm:
   * Khi click vào một dòng trên Cây Node \rightarrow Highlight viền của phần tử tương ứng ngoài màn hình bằng CSS Border (thông qua việc so khớp ID).
   * Hỗ trợ bấm trực tiếp vào phần tử ngoài màn hình để tự động "Focus" (nhảy dòng) đến đúng Node đó trên cây thư mục bên trái.
 * Không làm:
   * Tự tạo các logic dịch chuyển đối tượng phức tạp. Sử dụng hoàn toàn cơ chế Re-render dựa trên State của React.
