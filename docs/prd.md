
---

PRD - Web Visual Builder (Draft v2)

1. Product Vision

Xây dựng một Visual UI Builder chạy trên trình duyệt cho phép người dùng kéo thả component để tạo giao diện React (JSX) mà không cần viết code.

MVP tập trung vào tốc độ, sự đơn giản và khả năng xuất mã JSX sạch.


---

2. MVP Goal

Trong vòng vài phút, người dùng có thể:

Tạo project mới

Kéo component vào canvas

Chỉnh sửa thuộc tính

Xem preview

Xuất JSX

Lưu project trên trình duyệt


Không yêu cầu đăng nhập.


---

3. Target User

Frontend Developer

Indie Hacker

Freelancer

Người học React

Người muốn prototype nhanh



---

4. Core Features

Project

New Project

Open Project

Rename

Delete

Local Storage



---

Canvas

Infinite Canvas

Zoom

Pan

Select

Multi Select (nếu còn thời gian)



---

Component Palette

MVP chỉ gồm:

Container

Card

Button



---

Inspector

Cho phép sửa:

Layout

Width

Height


Spacing

Padding

Margin

Gap


Appearance

Background

Border Radius

Border

Shadow


Typography

Font Size

Font Weight

Color



---

Hierarchy

Hiển thị cây component

Cho phép:

Select

Drag

Reorder



---

JSX Generator

Sinh JSX sạch.

Ví dụ:

<Card>
  <Button>Click me</Button>
</Card>


---

Preview

Render trực tiếp bằng React.


---

Export

Copy JSX

Download JSON



---

5. Data Model

Project

Project {
    id
    name
    createdAt
    updatedAt
    rootNode
}

Component

ComponentNode {
    id
    type
    props
    style
    children
}


---

6. UI Layout

+-----------------------------------------+

Toolbar

+---------+----------------------+---------+

Palette | Canvas | Inspector

| | |Hierarchy|

+---------+----------------------+---------+


---

7. Tech Stack

Framework

Next.js

React

TypeScript


UI

TailwindCSS

shadcn/ui


State

Zustand


Drag Drop

dnd-kit


Persistence

LocalStorage



---

8. Out of Scope

MVP không có:

Authentication

Cloud Sync

Team Collaboration

AI

Undo/Redo

Version History

Plugin

Custom Component

Backend



---

9. Success Criteria

Người dùng có thể:

Tạo project

Thêm component

Sửa style

Xem preview

Copy JSX

Reload trình duyệt vẫn giữ project



---

10. Future Roadmap

Sau MVP:

Supabase Sync

Authentication

Component Library

Responsive Mode

AI Layout Generation

Import JSX

Export React Project

Theme System

Design Tokens



---