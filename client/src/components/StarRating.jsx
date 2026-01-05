import { Star } from 'lucide-react';

const StarRating = ({ rating, setRating, readonly = false }) => {
    return (
        <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readonly && setRating(star)}
                    className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                    disabled={readonly}
                >
                    <Star
                        size={20}
                        className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-secondary opacity-30'}`}
                    />
                </button>
            ))}
        </div>
    );
};

export default StarRating;
