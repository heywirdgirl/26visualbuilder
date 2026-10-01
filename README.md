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
│   ├── robots.ts
│   └── sitemap.ts
├── components
│   └── ui
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
├── core
│   ├── providers
│   │   └── client-provider.tsx
│   ├── r2
│   │   └── env.ts
│   ├── registry
│   │   ├── html-nodes.ts
│   │   ├── node-registry.ts
│   │   ├── node-rules.ts
│   │   ├── shadcn-nodes.ts
│   │   ├── system-nodes.ts
│   │   └── ui-dependencies.ts
│   ├── store
│   │   └── builder-store.ts
│   ├── supabase
│   │   ├── client.ts
│   │   ├── proxy.ts
│   │   └── server.ts
│   ├── types
│   │   ├── builder.types.ts
│   │   ├── generated-file.types.ts
│   │   ├── node-definition.types.ts
│   │   ├── page-capture.types.ts
│   │   └── style.types.ts
│   └── utils
│       ├── cn.ts
│       ├── escape-jsx-text.ts
│       ├── site-url.ts
│       ├── style-cascade.ts
│       └── style-to-classes.ts
├── features
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
│   │   │   ├── inspector-panel.tsx
│   │   │   ├── layout-section.tsx
│   │   │   ├── position-section.tsx
│   │   │   ├── self-layout-section.tsx
│   │   │   ├── sizing-section.tsx
│   │   │   ├── spacing-section.tsx
│   │   │   ├── style-field.tsx
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
│   │   │   └── quick-add-dropdown.tsx
│   │   └── constants
│   │       └── common-node-ids.ts
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
