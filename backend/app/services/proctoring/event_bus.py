import asyncio
from collections import defaultdict

from app.models.proctoring import RealtimeEvent


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[RealtimeEvent]]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def subscribe(self, session_id: str) -> asyncio.Queue[RealtimeEvent]:
        queue: asyncio.Queue[RealtimeEvent] = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers[session_id].add(queue)
        return queue

    async def unsubscribe(self, session_id: str, queue: asyncio.Queue[RealtimeEvent]) -> None:
        async with self._lock:
            self._subscribers[session_id].discard(queue)

    async def publish(self, event: RealtimeEvent) -> None:
        if not event.session_id:
            return
        async with self._lock:
            subscribers = list(self._subscribers.get(event.session_id, set()))

        for queue in subscribers:
            if queue.full():
                try:
                    queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            await queue.put(event)


event_bus = EventBus()
