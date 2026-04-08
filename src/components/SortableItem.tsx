import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

type Props = {
  id: string;
  title: string;
  onRemove: (id: string) => void;
};

const SortableItem = ({ id, title, onRemove }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} className="list-item">
      <span {...attributes} {...listeners} style={{ cursor: 'grab', touchAction: 'none' }}>
        {id === 'mur_purr' ? (
          <img 
            src="/cat.png" 
            alt="Orange Cat" 
            style={{ width: '68px', height: '45px', borderRadius: '23px', objectFit: 'cover', verticalAlign: 'middle' }} 
          />
        ) : (
          <>☰ {title}</>
        )}
      </span>

      <button className="remove-btn" onClick={() => onRemove(id)}>
        x
      </button>
    </div>
  );
};

export default SortableItem;