```text
src
├── app
│   ├── (shell)
│   │   ├── [username]
│   │   │   ├── [slug]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── posts
│   │   │   └── [postId]
│   │   │       └── page.tsx
│   │   ├── profile
│   │   │   └── page.tsx
│   │   ├── projects
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api
│   │   ├── ai
│   │   │   └── add-node
│   │   │       └── route.ts
│   │   └── upload-thumbnail
│   │       └── route.ts
│   ├── auth
│   │   ├── auth-code-error
│   │   │   └── page.tsx
│   │   └── callback
│   │       └── route.ts
│   ├── editor
│   │   ├── [projectId]
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── post
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── preview.css
│   ├── robots.ts
│   └── sitemap.ts
├── components
│   └── ui
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── hover-card.tsx
│       ├── input-group.tsx
│       ├── input-otp.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       └── tooltip.tsx
├── core
│   ├── providers
│   │   └── client-provider.tsx
│   ├── r2
│   │   └── env.ts
│   ├── registry
│   │   ├── ai-registry-summary.ts
│   │   ├── blocks.ts
│   │   ├── color-palette.ts
│   │   ├── default-presets.ts
│   │   ├── html-extra-nodes.ts
│   │   ├── html-nodes.ts
│   │   ├── node-registry.ts
│   │   ├── node-rules.ts
│   │   ├── shadcn-cluster-nodes.ts
│   │   ├── shadcn-extra-nodes-b.ts
│   │   ├── shadcn-extra-nodes.ts
│   │   ├── shadcn-nodes.ts
│   │   ├── style-presets.ts
│   │   ├── system-nodes.ts
│   │   └── ui-dependencies.ts
│   ├── store
│   │   └── builder-store.ts
│   ├── supabase
│   │   ├── client.ts
│   │   ├── proxy.ts
│   │   └── server.ts
│   ├── types
│   │   ├── ai-operation.types.ts
│   │   ├── block.types.ts
│   │   ├── builder.types.ts
│   │   ├── generated-file.types.ts
│   │   ├── node-definition.types.ts
│   │   ├── page-capture.types.ts
│   │   └── style.types.ts
│   └── utils
│       ├── apply-ai-operations.ts
│       ├── build-node-tree.ts
│       ├── cn.ts
│       ├── escape-jsx-text.ts
│       ├── normalize-cluster-values.ts
│       ├── site-url.ts
│       ├── style-cascade.ts
│       └── style-to-classes.ts
├── features
│   ├── ai-assistant
│   │   ├── components
│   │   │   └── ai-add-node-popover.tsx
│   │   ├── hooks
│   │   │   └── use-ai-add-node.ts
│   │   ├── prompts
│   │   │   └── add-node.prompt.ts
│   │   ├── schemas
│   │   │   └── ai-output.schema.ts
│   │   └── utils
│   │       ├── build-ai-context.ts
│   │       └── outline-tree.ts
│   ├── app-shell
│   │   └── components
│   │       └── app-shell.tsx
│   ├── auth
│   │   ├── components
│   │   │   └── login-button.tsx
│   │   └── hooks
│   │       ├── use-auth-actions.ts
│   │       └── use-auth-sync.ts
│   ├── canvas-preview
│   │   ├── components
│   │   │   ├── component-renderer.tsx
│   │   │   ├── preview-workspace.tsx
│   │   │   └── shadow-root-wrapper.tsx
│   │   ├── constants
│   │   │   ├── cluster-renderers.tsx
│   │   │   ├── html-extra-renderers.tsx
│   │   │   ├── shadcn-extra-renderers-b.tsx
│   │   │   ├── shadcn-extra-renderers.tsx
│   │   │   └── renderer-map.tsx
│   │   └── utils
│   │       ├── capture-active-page.ts
│   │       ├── capture-all-pages.ts
│   │       └── capture-image.ts
│   ├── cloud-save
│   │   ├── components
│   │   │   └── save-project-button.tsx
│   │   └── hooks
│   │       ├── use-load-project.ts
│   │       └── use-save-project.ts
│   ├── code-generator
│   │   ├── components
│   │   │   └── code-modal.tsx
│   │   └── utils
│   │       ├── export-project.ts
│   │       ├── json-to-jsx.ts
│   │       └── path-utils.ts
│   ├── comments
│   │   ├── actions
│   │   │   ├── create-comment-action.ts
│   │   │   ├── delete-comment-action.ts
│   │   │   └── update-comment-action.ts
│   │   ├── components
│   │   │   ├── comment-composer.tsx
│   │   │   ├── comment-item.tsx
│   │   │   └── comments-section.tsx
│   │   ├── hooks
│   │   │   └── use-post-comments.ts
│   │   └── utils
│   │       ├── fetch-comments-page.ts
│   │       └── get-post-comments.ts
│   ├── export-image
│   │   ├── components
│   │   │   └── export-image-dialog.tsx
│   │   └── hooks
│   │       └── use-export-image.ts
│   ├── export-project
│   │   ├── components
│   │   │   └── export-project-button.tsx
│   │   ├── constants
│   │   │   └── project-template-files.ts
│   │   ├── hooks
│   │   │   └── use-export-project.ts
│   │   └── utils
│   │       ├── build-zip.ts
│   │       ├── collect-ui-dependencies.ts
│   │       └── fetch-ui-files.ts
│   ├── feed
│   │   ├── components
│   │   │   └── post-card.tsx
│   │   └── utils
│   │       └── get-feed-posts.ts
│   ├── global-shell
│   │   ├── components
│   │   │   ├── global-topbar.tsx
│   │   │   └── project-sidebar.tsx
│   │   └── hooks
│   │       └── use-recent-projects.ts
│   ├── inspector
│   │   ├── components
│   │   │   ├── appearance-section.tsx
│   │   │   ├── breakpoint-switcher.tsx
│   │   │   ├── color-picker-field.tsx
│   │   │   ├── dynamic-props-form.tsx
│   │   │   ├── effects-section.tsx
│   │   │   ├── extras-section.tsx
│   │   │   ├── gradient-section.tsx
│   │   │   ├── inspector-panel.tsx
│   │   │   ├── layout-section.tsx
│   │   │   ├── position-section.tsx
│   │   │   ├── preset-section.tsx
│   │   │   ├── section-shell.tsx
│   │   │   ├── self-layout-section.tsx
│   │   │   ├── sizing-section.tsx
│   │   │   ├── spacing-section.tsx
│   │   │   ├── style-controls.tsx
│   │   │   ├── style-field.tsx
│   │   │   ├── transform-section.tsx
│   │   │   ├── typography-extras-section.tsx
│   │   │   └── typography-section.tsx
│   │   └── hooks
│   │       └── use-style-field.ts
│   ├── likes
│   │   ├── actions
│   │   │   └── toggle-like-action.ts
│   │   └── hooks
│   │       └── use-toggle-like.ts
│   ├── media-upload
│   │   └── hooks
│   │       └── use-upload-image.ts
│   ├── node-palette
│   │   ├── components
│   │   │   ├── add-node-browser.tsx
│   │   │   ├── node-list-row.tsx
│   │   │   ├── palette-sections.tsx
│   │   │   └── quick-add-dropdown.tsx
│   │   ├── constants
│   │   │   ├── block-icons.ts
│   │   │   ├── common-node-ids.ts
│   │   │   └── node-icons.ts
│   │   └── utils
│   │       └── palette-data.ts
│   ├── node-tree-preview
│   │   └── components
│   │       ├── readonly-node-row.tsx
│   │       └── readonly-node-tree.tsx
│   ├── nodes-tree
│   │   ├── components
│   │   │   ├── tree-node-item.tsx
│   │   │   ├── tree-toolbar.tsx
│   │   │   └── tree-view.tsx
│   │   └── hooks
│   │       └── use-tree-shortcuts.ts
│   ├── post-actions
│   │   └── components
│   │       └── post-actions-bar.tsx
│   ├── post-detail
│   │   └── utils
│   │       └── get-post-detail-data.ts
│   ├── post-gallery
│   │   ├── components
│   │   │   ├── feed-image-carousel.tsx
│   │   │   └── post-detail-gallery.tsx
│   │   └── utils
│   │       └── build-gallery.ts
│   ├── profile
│   │   ├── actions
│   │   │   └── update-profile-action.ts
│   │   ├── components
│   │   │   └── profile-form.tsx
│   │   └── utils
│   │       └── resolve-profile-by-username.ts
│   ├── projects-list
│   │   └── components
│   │       └── projects-list.tsx
│   ├── publish-post
│   │   ├── actions
│   │   │   └── clone-post-action.ts
│   │   ├── components
│   │   │   ├── clone-button.tsx
│   │   │   └── post-project-button.tsx
│   │   ├── hooks
│   │   │   ├── use-clone-post.ts
│   │   │   └── use-prepare-post.ts
│   │   └── utils
│   │       └── data-url-to-file.ts
│   └── share-post
│       └── components
│           └── share-post.tsx
├── lib
│   └── utils.ts
└── middleware.ts
```

### Style presets

Shared style presets are defined in `src/core/registry/style-presets.ts`. New nodes
use the per-node defaults from `src/core/registry/default-presets.ts`; unmapped
node types continue to use their registry `defaultStyle`. The Inspector's Preset
section applies a preset to the selected node or resets it to that node type's
default style. Applying a preset replaces the node's complete style, including
responsive breakpoints and interaction states.
