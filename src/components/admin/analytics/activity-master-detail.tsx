"use client";

import { useState, type Key, type ReactNode } from "react";
import { Clock3, Info, MousePointerClick, X } from "lucide-react";

interface ActivityMasterDetailProps<T> {
  items: T[];
  title: string;
  detailTitle: string;
  emptyMessage: string;
  placeholderText: string;
  listIcon: ReactNode;
  placeholderIcon?: ReactNode;
  getItemKey: (item: T) => Key;
  getItemTimestamp: (item: T) => string;
  detailTimestampLabel: string;
  renderListItem: (item: T, selected: boolean) => ReactNode;
  renderDetailContent: (item: T) => ReactNode;
}

export function formatAnalyticsDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityDetailItem({
  label,
  value,
  fullWidth,
  truncate,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className={`${fullWidth ? "col-span-2" : ""} animate-fade-in`}>
      <p className="text-[hsl(var(--muted-foreground))] mb-1 text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className={`font-medium ${truncate ? "truncate" : ""}`}>{value}</p>
    </div>
  );
}

export function ActivityMasterDetail<T>({
  items,
  title,
  detailTitle,
  emptyMessage,
  placeholderText,
  listIcon,
  placeholderIcon,
  getItemKey,
  getItemTimestamp,
  detailTimestampLabel,
  renderListItem,
  renderDetailContent,
}: ActivityMasterDetailProps<T>) {
  const [selectedItemKey, setSelectedItemKey] = useState<Key | null>(null);
  const selectedItem =
    items.find((item) => getItemKey(item) === selectedItemKey) ?? null;

  const handleSelect = (item: T) => {
    const itemKey = getItemKey(item);
    setSelectedItemKey((currentKey) =>
      currentKey === itemKey ? null : itemKey
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {listIcon}
          {title}
        </h3>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[hsl(var(--border))] px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {items.map((item, index) => {
              const itemKey = getItemKey(item);
              const selected = selectedItemKey === itemKey;

              return (
                <div
                  key={itemKey}
                  onClick={() => handleSelect(item)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 animate-slide-up hover:-translate-y-0.5 ${
                    selected
                      ? "bg-[hsl(var(--primary))]/20 border border-[hsl(var(--primary))] shadow-md shadow-[hsl(var(--primary))]/10"
                      : "bg-[hsl(var(--secondary))] border border-transparent hover:bg-[hsl(var(--secondary))]/80 hover:border-[hsl(var(--border))] hover:shadow-md hover:shadow-black/10"
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {renderListItem(item, selected)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-8 h-fit">
        {selectedItem ? (
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 animate-slide-in-right">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="w-5 h-5 text-[hsl(var(--primary))]" />
                {detailTitle}
              </h3>
              <button
                onClick={() => setSelectedItemKey(null)}
                className="p-1.5 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderDetailContent(selectedItem)}
            <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
              <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <Clock3 className="w-3 h-3" />
                {detailTimestampLabel}:{" "}
                {formatAnalyticsDate(getItemTimestamp(selectedItem))}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] border-dashed p-12 text-center animate-fade-in">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center">
              {placeholderIcon ?? (
                <MousePointerClick className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
              )}
            </div>
            <p className="text-[hsl(var(--muted-foreground))]">
              {placeholderText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
