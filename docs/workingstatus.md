
v1



V1
Node Tree
Preview
Inspector
Export JSX
V2
Property Schema
Tailwind Compiler
Template
V3
Data Binding
State
Actions
Simple Events
V4
Supabase
Community
Marketplace
Template Sharing
V5
AI
Generate UI
Refactor Layout
Fix Responsive
V6 (nếu thật sự cần)
Mini Script
Hoặc Plugin API





## Kế hoạch V1.9 — 6 Phase

**Phase 1 — Registry & Node Rules**
Thêm `nodeKind` (`folder|page|component|component-instance|html|shadcn`) + bảng rule "nodeKind nào chứa được nodeKind nào". Tạo 4 NodeDefinition hệ thống mới (`system.folder`, `system.page`, `system.component`, `system.component-instance`) trong file riêng, merge vào registry hiện có. **Không đụng 62 definition HTML/shadcn cũ** — giữ nguyên `canHaveChildren` cho chúng, chỉ thêm rule mới cho 4 loại structural.

**Phase 2 — Store: Project Tree + Page/Component actions**
`tree` root giờ là Project (auto có sẵn 2 folder App/Components). Thêm `activePageId`. Thêm action `addFolder/addPage/addComponent(parentId, name)`, `addComponentInstance(parentId, componentNodeId)`. `addNode` cũ tổng quát hoá để check rule theo nodeKind. Guard: chặn xoá Component Node đang có Instance ở nơi khác; chặn Convert/Instance tạo vòng lặp (A chứa B, B chứa A).

**Phase 3 — Canvas: render Page active + resolve Instance + cross-ref highlight**
`PreviewWorkspace` chỉ render `activePageId`. `ComponentRenderer` gặp `component-instance` → lookup Component Node thật, render đệ quy (kèm `Set` chống vòng lặp). Thêm cơ chế highlight: click Component Node (definition) → quét Page đang mở, outline mọi Instance khớp `referenceId`.

**Phase 4 — Tree UI: Folder/Page/Component visuals + Convert to Component**
Icon/màu riêng theo nodeKind trong `TreeNodeItem`. Thêm hành động "Convert to Component" (right-click hoặc nút trong toolbar) — cắt node đang chọn thành Component Node mới dưới `Components/`, để lại 1 Instance đúng vị trí cũ.

**Phase 5 — Add Node Palette: rule-aware**
Chọn Folder → hiện 3 dòng đặc biệt "New Folder/Page/Component" (mở prompt nhập tên) thay vì list 62 node thường. Chọn Page/Component → giữ Node Browser/Quick Add như V1, cộng thêm category **"My Components"** liệt kê Component Node có sẵn để thêm Instance.

**Phase 6 — Code Generator: multi-file export**
`treeToJsx` đổi thành hàm export cả Project → trả về danh sách file `{path, content}[]` theo đúng cấu trúc `app/`/`components/` thật. Gặp Instance thì emit `<Name />` + import. `CodeModal` thêm tabs chọn file.


