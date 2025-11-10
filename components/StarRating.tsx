// components/StarRating.tsx
'use client';

import { useState } from 'react';
import { FaStar, FaCheckCircle } from 'react-icons/fa';

interface StarRatingProps {
  jokeId: number;
  initialRate: number;
}

export default function StarRating({ jokeId, initialRate }: StarRatingProps) {
  const [rating, setRating] = useState(initialRate || 0);
  const [hover, setHover] = useState(0);
  const [isRated, setIsRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async (ratingValue: number) => {
    setIsSubmitting(true);
    setRating(ratingValue); // Optimistically update the UI

    try {
      // Send the rating to our new API route
      const response = await fetch('/api/rate-joke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jokeId, rating: ratingValue }),
      });

      if (!response.ok) {
        // If the server responds with an error, throw an exception
        throw new Error('Failed to submit rating. Please try again.');
      }

      // If successful, show the success state
      setIsSubmitting(false);
      setIsRated(true);

      // Hide the success message after a couple of seconds
      setTimeout(() => {
        setIsRated(false);
      }, 2000);

    } catch (error) {
      console.error("Error submitting rating:", error);
      // If there was an error, revert the optimistic UI update
      setRating(initialRate || 0);
      setIsSubmitting(false);
      // Optionally, show an error message to the user
      alert("Sorry, we couldn't save your rating.");
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {isRated ? (
        <div className="flex items-center text-green-500 animate-pulse">
          <FaCheckCircle className="mr-2" />
          <span>Thanks for rating!</span>
        </div>
      ) : (
        <div className="flex items-center">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
              <label key={ratingValue}>
                <input
                  type="radio"
                  name={`rating-${jokeId}`}
                  value={ratingValue}
                  onClick={() => handleClick(ratingValue)}
                  disabled={isSubmitting} // Disable while submitting
                  className="hidden"
                />
                <FaStar
                  className={`cursor-pointer transition-colors duration-200 ${
                    isSubmitting ? 'animate-pulse text-yellow-400' : ''
                  }`}
                  color={ratingValue <= (hover || rating) ? '#ffc107' : '#e4e5e9'}
                  size={24}
                  onMouseEnter={() => !isSubmitting && setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}