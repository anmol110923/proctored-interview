from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.proctoring.event_bus import event_bus

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/sessions/{session_id}")
async def session_events(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()
    queue = await event_bus.subscribe(session_id)
    try:
        while True:
            event = await queue.get()
            await websocket.send_json(event.model_dump(mode="json"))
    except WebSocketDisconnect:
        await event_bus.unsubscribe(session_id, queue)
