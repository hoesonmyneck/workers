import * as React from "react"
import { cn } from "@/lib/utils"

export interface SearchableSelectProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  options: string[];
  onValueChange?: (value: string) => void;
}

const SearchableSelect = React.forwardRef<HTMLInputElement, SearchableSelectProps>(
  ({ className, options, onValueChange, value, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState(value?.toString() || '');
    const [isOpen, setIsOpen] = React.useState(false);
    const [filteredOptions, setFilteredOptions] = React.useState(options);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      setInputValue(value?.toString() || '');
    }, [value]);

    React.useEffect(() => {
      if (inputValue) {
        const filtered = options.filter(option =>
          option.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredOptions(filtered);
      } else {
        setFilteredOptions(options);
      }
    }, [inputValue, options]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsOpen(true);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    const handleOptionClick = (option: string) => {
      setInputValue(option);
      setIsOpen(false);
      if (onValueChange) {
        onValueChange(option);
      }
    };

    const handleClear = () => {
      setInputValue('');
      if (onValueChange) {
        onValueChange('');
      }
    };

    return (
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <input
            type="text"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            {...props}
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.map((option, index) => (
              <div
                key={index}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
SearchableSelect.displayName = "SearchableSelect"

export { SearchableSelect }
