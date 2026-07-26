Mình sẽ gọi đây là PRD v1.9 - Project Nodes Architecture. Theo mình đây không phải là bản thêm tính năng, mà là bản nâng cấp kiến trúc để chuẩn bị cho V2 (Inspector), V3 (Export) và V4 (Supabase).


---

PRD v1.9 - Project Nodes Architecture

Mục tiêu

Chuyển Builder từ tư duy "một HTML = một Page" sang "một Project = nhiều Node đặc biệt", lấy cảm hứng từ Godot và cấu trúc Next.js.

Mọi đối tượng trong Project đều được biểu diễn bằng Node. Editor chỉ làm việc với Node Tree duy nhất.


---

Mục tiêu chính

Everything is Node.

Project giống cấu trúc một dự án Next.js.

Canvas chỉ render router Node (page) hiện đang được mở.

Chuẩn bị nền tảng cho Export Code, Components, Router và Supabase.



---

Các loại Node

HTML Node

Ví dụ

Div
Section
Button
Image
Input

Được render trực tiếp.


---

shadcn Node

Ví dụ

Card
Dialog
Accordion
Tabs
Sheet

Được render bằng React Component.


---

Router Node (mới)

Đại diện cho

app/page.tsx

app/about/page.tsx

app/blog/page.tsx

Đặc điểm

Có thể chứa HTML Node

Có thể chứa Component Node Instance

Không được làm con của Component Node

Canvas Preview có thể render



---

Component Node (mới)

Đại diện cho

components/Header.tsx

components/Footer.tsx

components/LoginForm.tsx

Đặc điểm

Có thể chứa HTML Node

Có thể chứa Component Node Instance

Có thể được Router sử dụng nhiều lần

Canvas Preview có thể render trong router node
tuc la khi edit node nay dong loat tac dong den nhung noi tai su dung no



---

Folder Node (mới)

Đại diện cho thu muc con cua

components/

app/



Đặc điểm

Chỉ dùng tổ chức Project

Không render

Không export JSX



---

Node Tree

Ví dụ

Project

App
 ├── Home
 ├── About

Components
 ├── Header
 ├── Footer

 └── Hero

Click

Home

↓

Canvas

Home Page

Click

Header

↓

Canvas

hightlight all Header Component in page

Canvas luôn chỉ render router Root Node.


---

Add Node

Nút

+

vẫn giữ nguyên.

Node Browser giờ hiển thị

component in components/(new)

HTML

shadcn

Templates

Nếu đang chọn Folder

↓

được phép tạo

Folder

Router

Component

Nếu đang chọn Router

↓

được phép tạo

Div

Section

Card

Button

Nếu đang chọn Button

↓

không cho Add Child.


---

Node Rules

Mỗi Node tự khai báo khả năng.

Ví dụ

Folder

✓ chứa Folder

✓ chứa Router

✓ chứa Component

Router

✓ chứa HTML

✓ chứa shadcn

✓ chứa Component Instance

Button

✗ không chứa Node con

Editor không viết

if(type==="router")

Editor chỉ đọc Rule.


---

NodeDefinition

NodeDefinition mở rộng.

id

title

nodeKind

category

icon

capabilities

allowedParents

allowedChildren

defaultProps

propsSchema

NodeDefinition chỉ là Metadata.

Không chứa React Component.


---

Renderer

Renderer chỉ nhận

definitionId

↓

lookup Renderer Map

↓

render React Component.


---

Canvas

Canvas chỉ render

Router Node

Component Node in router page


Không render

Folder Node



---

Preview

Khi chuyển

Home

↓

Preview

Home Page

Khi chuyển

Header

↓

Preview

Header Component hinhlight in homepage

Không reload toàn Project.


---

Export

Project

App
 ├── Home
 └── About

Components
 ├── Header
 └── Footer

↓

Sinh

app/
    page.tsx
    about/page.tsx

components/
    Header.tsx
    Footer.tsx


---

Không làm trong v1.9

Dynamic Inspector.

Data Binding.

State Management.

Event System.

Template Marketplace.

Supabase Sync.

AI Generate UI.



---

Tiêu chí hoàn thành

Có thể tạo Folder, Router và Component từ Node Browser.

Node Tree quản lý toàn bộ Project.

Chuyển Router home hoặc route about  làm Canvas Preview thay đổi ngay.

Add Node tuân theo Rule của từng Node.

Export tạo đúng cấu trúc thư mục Next.js.

Kiến trúc sẵn sàng mở rộng cho Inspector, Supabase và Marketplace.



---

Mình chỉ đề xuất thêm một thay đổi rất nhỏ nhưng có giá trị lâu dài

Thay vì gọi là Router Node, hãy gọi là Page Node.

Lý do là:

Người dùng đang xây dựng trang, không phải router.

Sau này vẫn có thể ánh xạ sang app/page.tsx, app/about/page.tsx của Next.js.

Nếu tương lai hỗ trợ React Router, Vue Router hay SvelteKit thì khái niệm Page vẫn đúng, còn "Router" lại phụ thuộc framework.


Như vậy hệ thống co loại node cấp cao:

Folder
Page
Component
HTML
shadcn
icon

Đây là bộ khái niệm rất ổn định, đủ đơn giản để người dùng hiểu nhưng cũng đủ mạnh để mở rộng thành một visual builder hoàn chỉnh.