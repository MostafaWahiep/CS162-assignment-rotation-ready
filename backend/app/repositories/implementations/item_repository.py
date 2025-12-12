"""Item repository implementation."""
from typing import Optional
from sqlalchemy.orm import joinedload
from app import db
from app.models.item import Item
from app.models.category_item import CategoryItem
from app.models.item_tag_value import ItemTagValue
from app.models.value import Value
from app.repositories.base.item_repository_interface import ItemRepositoryInterface


class ItemRepository(ItemRepositoryInterface):
    """Repository for item operations."""

    def create_item(
        self,
        name: str,
        location: str,
        rotation_city_id: int,
        added_by_user_id: int,
        walking_distance: Optional[float] = None
    ) -> Item:
        """Create a new item."""
        item = Item(
            name=name,
            location=location,
            rotation_city_id=rotation_city_id,
            added_by_user_id=added_by_user_id,
            walking_distance=walking_distance
        )
        db.session.add(item)
        db.session.commit()
        db.session.refresh(item)
        return item

    def get_item_by_id(self, item_id: int, rotation_city_id: int) -> Optional[Item]:
        """Get item by ID (only if it belongs to the rotation city)."""
        return db.session.execute(
            db.select(Item).filter_by(item_id=item_id, rotation_city_id=rotation_city_id)
        ).scalar_one_or_none()

    def get_all_items(self, rotation_city_id: int) -> list[Item]:
        """Get all items from specific rotation city."""
        return db.session.execute(
            db.select(Item)
            .filter_by(rotation_city_id=rotation_city_id)
            .order_by(Item.created_at.desc())
        ).scalars().all()

    def get_all_items_with_details(self, rotation_city_id: int) -> list[Item]:
        """Get all items from rotation city with all relationships loaded."""
        result = db.session.execute(
            db.select(Item)
            .filter_by(rotation_city_id=rotation_city_id)
            .order_by(Item.created_at.desc())
            .options(
                joinedload(Item.rotation_city),
                joinedload(Item.added_by_user),
                joinedload(Item.category_items).joinedload(CategoryItem.category),
                joinedload(Item.item_tag_values).joinedload(ItemTagValue.value).joinedload(Value.tag)
            )
        )
        return result.scalars().unique().all()

    def get_item_by_id_with_details(self, item_id: int, rotation_city_id: int) -> Optional[Item]:
        """Get item by ID with all relationships (only if it belongs to rotation city)."""
        result = db.session.execute(
            db.select(Item)
            .filter_by(item_id=item_id, rotation_city_id=rotation_city_id)
            .options(
                joinedload(Item.rotation_city),
                joinedload(Item.added_by_user),
                joinedload(Item.category_items).joinedload(CategoryItem.category),
                joinedload(Item.item_tag_values).joinedload(ItemTagValue.value).joinedload(Value.tag)
            )
        )
        return result.unique().scalar_one_or_none()

    def exists(self, item_id: int) -> bool:
        """Check if item exists regardless of rotation city."""
        return db.session.query(
            db.session.query(Item).filter_by(item_id=item_id).exists()
        ).scalar()

    def update_verification_count(self, item_id: int, count: int) -> None:
        """Update the number of verifications for an item."""
        item = db.session.get(Item, item_id)
        if item:
            item.number_of_verifications = count
            db.session.commit()
