# DOTFORM

DOTFORM is a browser-based WebXR 3D modeling tool. Its goal is to let the user create simple 3D geometry directly with VR controllers, without a complicated interface.

## Overall experience

- The website should have a simple way to enter VR. The page itself should not contain a large modeling interface or a collection of desktop-style controls.
- When VR starts, show the instruction: **"Click a trigger to choose your main hand."**
- The user presses the trigger on the controller they want to use as their main hand.
- The other controller becomes the non-dominant hand. Controls are assigned by this choice, so either physical hand can be the main hand.
- The modeling environment should stay visually minimal and uncluttered.

## The 3D grid and selection

- The grid is conceptually available throughout 3D space, rather than being a small plane or a limited patch in front of the user.
- Grid positions are invisible by default. Do not render a field of dots around the user.
- Each controller independently selects the nearest grid position to its current hand position.
- Only the currently selected grid position for each hand is visible. This small visible dot shows where that hand would place or interact with geometry.
- The selected position updates as the hand moves.
- The grid is a snapping system, not part of the visible model. Only points, lines, and faces deliberately created by the user remain visible.

## Drawing points and lines

Both controllers can draw independently using their trigger buttons.

The trigger uses a press-and-hold interaction:

1. When the trigger is pressed, create a point at the grid position currently selected by that hand.
2. While the trigger remains held, moving the hand moves the preview endpoint to the newly selected grid position. A temporary line connects the starting point to that endpoint.
3. When the trigger is released, place the endpoint as a permanent point and make the connecting line permanent.
4. The user can begin another line from a new point or from an existing point, allowing lines and shapes to connect into shared geometry.

If the user presses and releases the trigger without moving to another grid position, leave one standalone point with no line.

When drawing from or onto an existing point, reuse that point rather than creating a duplicate. The temporary line is only a preview; it becomes permanent when the trigger is released.

## Open lines and filled polygons

- A single point is valid geometry.
- Two connected points form a visible line.
- Three or more connected points do **not** automatically create a face just because there are enough points.
- Open chains remain visible as white lines, with no fill.
- A polygon is created only when the user explicitly connects the chain back to its starting point, closing the loop.
- When a loop is explicitly closed and contains at least three distinct points, create a filled polygon surface.
- Polygon surfaces exist in 3D space and can be oriented in any direction. They have no thickness; a triangle is still a valid 3D surface.
- Larger polygons may be internally divided into triangles for rendering, while still behaving as one filled face.
- Do not automatically add a missing closing edge or fill an open chain.

## Moving existing points

Both controllers can move existing points.

- A hand selects the nearest grid position.
- Grip only does something when that selected position contains an existing point.
- Holding Grip on an existing point grabs it.
- While Grip is held, moving the hand moves the point.
- Releasing Grip places the point at the nearest grid position to the hand.
- If no existing point is selected, Grip does nothing.
- Moving a point should update the connected lines and any faces that use that point.

## Deleting points

The main hand's A button deletes the point at its currently selected grid position.

- If a placed point exists at that position, delete it.
- If no placed point exists there, do nothing.
- Delete all lines connected to the removed point.
- Remove any polygon faces that are no longer valid after the deletion.
- The invisible grid position itself is never deleted; it remains available for future placement.

## Controller controls

The main hand is whichever controller the user chooses at the beginning of the VR session.

| Action | Main hand | Non-dominant hand |
| --- | --- | --- |
| Draw / place | Trigger | Trigger |
| Delete selected point | A | Not assigned |
| Toggle view mode | B | Not assigned |
| Undo | Not assigned | X |
| Redo | Not assigned | Y |
| Grab and move selected point | Grip | Grip |

Both hands can select grid positions, draw, and move points independently. The main/non-dominant distinction only determines the special buttons.

## View mode

- Pressing B on the main hand toggles view mode on or off.
- View mode is for inspecting the model.
- While view mode is active, drawing, deleting, and moving geometry are disabled so the model cannot be changed accidentally.
- Pressing B again returns to editing mode.

## Undo and redo

- X on the non-dominant controller undoes the previous editing action.
- Y on the non-dominant controller redoes the most recently undone action.
- Undo and redo should cover geometry edits, including creating points and lines, closing polygons, deleting points, and moving points.
- A new edit after undo should clear the redo history, following normal undo/redo behavior.

## Visual style

- Keep the environment minimal and dark, with no unnecessary visual effects.
- Do not show the full grid or a cloud of nearby dots.
- The selected grid dot is the only visible indication of the current snap position for each hand.
- User-created points, permanent white lines, and filled polygon faces remain visible.
- The temporary line while holding the trigger should be visually distinct enough to recognize as a preview, without adding distracting effects.

## Implementation notes

- Build this as a browser-based WebXR experience using HTML, CSS, and JavaScript.
- Keep the code straightforward and understandable. Prefer a simple implementation over unnecessary complexity.
- The grid can be calculated procedurally: it does not need to create and render an actual infinite collection of dot objects.
- Test controller input and interactions on a real compatible VR headset. Desktop mouse controls can be useful for development, but they do not replace headset testing.
- Treat the behavior in this document as the design specification. If an implementation detail conflicts with these interaction rules, preserve the intended user experience.
