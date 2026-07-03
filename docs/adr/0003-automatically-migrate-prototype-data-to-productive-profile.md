# Automatically Migrate Prototype Data To Productive Profile

When DeskPilot creates the productive data profile, it should immediately copy the existing prototype data into that profile once. The migration must be non-destructive: it must preserve the prototype source data, avoid silent overwrites, and mark completion so future development and test runs cannot repeatedly import or mutate the user's productive sessions. After this productive cutover, further prototype data changes are not imported automatically; the UI should make that clear until version 1.0 is complete.
