# Update node engine

Node 18 was recently released, but we're not ready to upgrade yet. So we need to pin the React types to v17

```diff
diff --git a/package.json b/package.json
index b22c4c0..bd018e5 100644
--- a/package.json
+++ b/package.json
@@ -21,5 +21,8 @@
   "prisma": {
     "seed": "yarn rw exec seed"
   },
-  "packageManager": "yarn@3.2.0"
+  "packageManager": "yarn@3.2.0",
+  "resolutions": {
+    "@types/react": "17.0.40"
+  }
 }
```
