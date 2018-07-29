---
date: {{ .Date }}
slug: {{ (dateFormat "2006-01-28" .Date ) }}-{{ (substr .UniqueID 0 6) }}
---

