# V49 smoke checks

1. Footer/drawer shows V49 and old V45 badge is hidden.
2. Admin > Crew > إدارة الرحلة contains Push sender with audience, title, message and destination.
3. Server RPC enforces admin-only sending and local destination URLs.
4. Manifest uses regular icons for `any` and the padded 768x768 icon only for `maskable` adaptive launcher rendering.
5. Service worker cache is V49 and includes new admin/version assets.
