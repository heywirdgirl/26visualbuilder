Theo mình, đừng cố đưa toàn bộ HTML và toàn bộ shadcn vào V1. Hãy xây dựng một Node Registry có khả năng mở rộng, nhưng V1 chỉ đăng ký khoảng 30–40 node. Đây là số lượng đủ để tạo hầu hết giao diện CRUD, dashboard và landing page.

HTML Core Nodes (Hạt nhân)

1. Layout

div
section
main
header
footer
aside
article

Đây là các node dùng để tổ chức bố cục.


---

2. Typography

h1
h2
h3
p
span
label

V1 chưa cần strong, em, small, mark...


---

3. Form

button
input
textarea
select
checkbox
radio
switch

switch có thể ánh xạ sang component nếu muốn.


---

4. List

ul
ol
li


---

5. Media

img
icon
separator

icon thực tế sẽ dùng lucide-react.


---

6. Navigation

nav
a


---

=> Tổng khoảng 22 node HTML.


---

shadcn Components (V1)

Mình sẽ không lấy hết gần 50 component của shadcn, mà chia theo mức độ ưu tiên.

⭐ Essential

Button

Card

Input

Textarea

Label

Checkbox

Radio Group

Switch

Select

Badge

Avatar

Separator


---

⭐ Layout

Scroll Area

Tabs

Accordion

Collapsible

Resizable


---

⭐ Feedback

Alert

Alert Dialog

Dialog

Sheet

Popover

Tooltip

Toast


---

⭐ Data

Table

Progress

Skeleton


---

⭐ Navigation

Breadcrumb

Pagination

Navigation Menu


---

⭐ Overlay

Dropdown Menu

Context Menu

Menubar

Hover Card


---

=> Khoảng 30 component là đủ cho V1.


---

Templates (V1)

tam thoi de trong

---

Tổng Registry

Node Registry

HTML
    22

Components
    30

Templates
    0

 52 Node Definition.

Theo mình đây là con số hợp lý.


---

Một ý tưởng mình nghĩ sẽ rất mạnh

Thay vì Registry chỉ có:

Button

Mỗi Node Definition nên có metadata.

Ví dụ:

{
  id: "html.div",

  title: "Div",

  category: "HTML/Layout",

  icon: "...",

  canHaveChildren: true,

  defaultProps: {},

  tags: [
      "layout",
      "container",
      "flex"
  ]
}

Hoặc

{
  id: "shadcn.card",

  title: "Card",

  category: "Components/Data Display",

  canHaveChildren: true,

  defaultProps: {...},

  tags: [
      "card",
      "panel",
      "container"
  ]
}

Điều này mang lại rất nhiều lợi ích:

Search theo tên hoặc từ khóa (panel vẫn tìm ra Card).

Popup "Add Node" tự nhóm theo danh mục.

Inspector biết node nào cho phép có con.

Sau này có thể thêm Material UI, Ant Design hoặc thư viện riêng mà không phải sửa kiến trúc.


Mình còn đề xuất một nguyên tắc cho V1

Đừng chia Registry theo "HTML" và "shadcn" trong giao diện người dùng.

Hãy chia theo chức năng:

Layout
    div
    section
    Card
    Resizable

Typography
    h1
    p
    Label

Form
    Button
    Input
    Select
    Checkbox
    Switch

Navigation
    Tabs
    Navigation Menu
    Breadcrumb

Overlay
    Dialog
    Sheet
    Popover
    Dropdown Menu

Data Display
    Table
    Badge
    Avatar
    Progress
    Skeleton

Templates
    

Người dùng thường nghĩ theo mục đích ("mình cần một component Form"), chứ không nghĩ "đây là HTML hay shadcn". Còn việc node đó là thẻ HTML hay React component chỉ là chi tiết triển khai trong Registry. Cách phân loại theo chức năng sẽ giúp trải nghiệm thêm node tự nhiên hơn và cũng dễ mở rộng khi sau này bạn có thư viện component của riêng mình.

Theo mình, nếu mục tiêu của bạn là Godot cho Web UI, thì mình sẽ không chọn Dropdown. Mình sẽ chọn Popup "Create Node" giống Godot, nhưng tối ưu hơn cho Web.

So sánh hai phương án

1. Dropdown

Ví dụ:

+
├─ HTML
├─ Components
├─ Templates

Chọn tiếp:

Components

├─ Button
├─ Card
├─ Dialog
├─ ...

Ưu điểm

Nhanh.

Code đơn giản.

Ít chiếm màn hình.

Phù hợp khi chỉ có khoảng 20 node.


Nhược điểm

Khi node tăng lên:

Components

Button
Card
Dialog
Tabs
Accordion
Avatar
Badge
Breadcrumb
Calendar
Carousel
Checkbox
Combobox
...

Dropdown sẽ rất dài.

Không có preview.

Khó tìm kiếm.

Khó phân nhóm.


---

2. Popup như Godot

Nhấn +

Hiện:

+---------------------------+
| Add Node                  |
|---------------------------|
| 🔍 Search...              |
|                           |
| ▶ HTML                    |
| ▶ Components              |
| ▶ Templates               |
|                           |
| Recent                    |
| Favorites                 |
+---------------------------+

Click Components

Components

Layout
Form
Navigation
Overlay
Data Display

Click Form

Button
Input
Checkbox
Switch
Textarea
...


---

Ưu điểm

Có Search.

Có phân loại.

Có thể thêm icon.

Có thể thêm mô tả.

Có Favorites.

Có Recent.

Có Keyboard.

Sau này 300 node vẫn dùng được.


---

Theo mình còn có phương án thứ 3

Mình gọi là Quick Add + Node Browser.

Nhấn nhanh

Nếu chỉ muốn thêm node.

Nhấn +

↓

Search...

button
card
div
section

Giống VS Code Command Palette.

Enter.

Xong.


---

Muốn duyệt

Có nút

Browse...

↓

Mở Node Browser đầy đủ.


---

Đây là UX mình thích nhất

+
│
▼

┌────────────────────────────────┐
│ Add Node                       │
│                                │
│ 🔍 Search node...              │
│                                │
│ Recent                         │
│ Card                           │
│ Button                         │
│                                │
│ Categories                     │
│ HTML                           │
│ Components                     │
│ Templates                      │
└────────────────────────────────┘

Gõ

but

↓

Button

Icon Button

Submit Button

Floating Button

Không cần mở catalog.


---

Tại sao mình không thích Dropdown?

Bạn đang xây một editor.

Editor sẽ ngày càng lớn.

Hôm nay:

40 node

Năm sau:

250 node

Dropdown sẽ trở thành:

Menu

↓

Submenu

↓

Submenu

↓

Scroll

↓

Scroll

UX rất tệ.


---

Mình nghĩ Godot có một quyết định rất đúng

Godot không cố làm:

Menu

↓

Menu

↓

Menu

Mà dùng

Popup

↓

Search

↓

Enter

Khi đã quen, gần như không cần dùng chuột.


---

Nếu là dự án này, mình sẽ còn sửa Godot một chút

Thay vì popup chỉ có danh sách, mình sẽ biến nó thành Node Palette.

┌────────────────────────────────────────────┐
│ Add Node                                   │
├────────────────────────────────────────────┤
│ 🔍 Search...                               │
├───────────────┬────────────────────────────┤
│ HTML          │ Div                        │
│ Components    │ Section                    │
│ Templates     │ Flex Container             │
│ Favorites     │                            │
│ Recent        │ Mô tả ngắn                 │
│               │ Có children: ✓             │
│               │ Props: 8                   │
└───────────────┴────────────────────────────┘

Điểm mạnh của cách này là vẫn giữ được tốc độ của Godot (nhấn + → gõ → Enter), nhưng khi người dùng chưa nhớ tên node thì vẫn có thể duyệt theo danh mục, xem mô tả và icon. Theo mình đây là hướng phù hợp nhất cho một Visual Builder có khả năng mở rộng lên hàng trăm node trong tương lai.