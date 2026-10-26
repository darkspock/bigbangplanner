---
name: bigbangplanner
description: Builds and edits an interactive 3D model of a home from its floor plan, measurements and photos, with a first-person walk, a measuring tool, single-room view and a 2D plan with dimensions, in English and Spanish. Use it when someone wants to see their home or a renovation in 3D, furnish it, try another layout, check whether something fits or compare real measurements with the plan's.
---

# Big Bang Planner

A kit to turn a home's floor plan into a 3D model you can explore in the browser. The engine (`engine/`) is already done: for each house you only write a data file, `houses/<name>/house.js`, in metres. Nothing needs installing: three.js loads from a CDN.

- Full house format and list of pieces: `docs/FORMAT.md`. **Read it before writing a house.**
- Complete example: `houses/apartment-4a/house.js`.
- The engine is not changed for a particular house. If a piece of furniture is missing, define it as a custom piece inside that `house.js`.

## Language

- **Talk to the user in their language.** The code, file names and data keys are in English whatever the user speaks.
- The viewer's interface is in English and Spanish and follows the browser (`?lang=en|es` forces one). Write the house texts (`name`, `description`, room names and cards, furniture names and cards, labels) as `{ en, es }` when the house will be seen in both languages; if the user only needs one, a plain string is enough. Ask if unsure.

## How to work with the user

### 1. Prepare

- Copy this kit folder to wherever the user's project will live (or work in it if it is already theirs).
- Create `houses/<name>/house.js` (name in lowercase, with hyphens) from the example, emptying walls, rooms and furniture.
- Ask for **the plan** (image or PDF) and **one real, known measurement** of a long wall: that is what sets the scale.

### 2. Scale and origin

- Work out the plan's scale from that measurement (pixels per metre). With a printed scaled plan, check the scale with two measurements, not one.
- Put the origin at the outer north-west corner and convert everything to metres. **Do not store pixels in `house.js`**: the data must read as measurements.
- If the plan does not have north at the top, turn it in your head: in `house.js`, "north" is the top of the drawing.

### 3. Walls, openings and rooms (in this order)

1. **Walls**, outer and partitions, as face-to-face rectangles. Leave no gaps: doors and windows cut them on their own.
2. **Doors and windows.** The opening covers the whole thickness of the wall. For each door, ask or work out from the plan which way it opens and where the hinges are: the arc on the plan shows it.
3. **Rooms** with their interior polygon, floor and a short card.

### 4. Check against reality

- Open the preview (see below) and use the **Plan** button: it gives each room's interior dimensions, wall face to wall face.
- **Ask the user for real measurements** of the important rooms and compare them with the Plan's.
- **When the measurements do not add up**, do not choose for them: say how much is missing or left over, in which stretch, and ask which measurement wins. Often the plan is wrong; sometimes the measurement is.
- Correct in metres. The Plan will tell you whether it is right.

### 5. Furnish

- Room by room, from photos or from what the user tells you. Use the pieces in `docs/FORMAT.md`.
- **Make one change at a time and confirm it** before the next one, especially if the user marks places on a screenshot: put it exactly where they say, without reinterpreting.
- Check in the **Top** view that items do not overlap each other or the swing of the doors.
- If a piece does not exist, create it as a custom piece in `pieces` in `house.js`, with the utilities in `c`.

### 6. Show and publish

- **Local preview:** in the kit folder, `python3 -m http.server 8000`, and open `http://localhost:8000/viewer.html?house=<name>` (add `&lang=en` or `&lang=es` to check each language). Make sure the console has no errors.
- **Publish:** as a claude.ai Artifact, with `viewer.html` as the page and, in `files`, every file in `engine/` and the `houses/<name>/` folder (with its images, if any). Artifacts are private until the user shares them. To open the user's house without `?house=`, change the default house in `viewer.html` (`'apartment-4a'`).
- **Before publishing**, go through what shows with the user: photos of people, real names, the address or anything that identifies the home. Ask before including it.

## Rules

- **Measurements:** the user's real measurements win over the plan. If they do not give them, say in the room's card that they come from the plan or are approximate. Do not invent measurements and present them as real.
- **Do not touch `engine/`** for a particular house. If something general really is missing (a door type, a tool), suggest it to the user as an improvement to the kit.
- **Each house in its own folder.** A house's images (paintings, photos) go in `houses/<name>/` and are referenced with a path relative to `viewer.html`, e.g. `houses/<name>/photo.jpg`.
- **Third-party images:** do not put images or models in the house whose licence does not allow publishing them. The kit's pieces are procedural and do not have that problem.
