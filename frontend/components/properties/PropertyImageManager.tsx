"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media-url";
import { toast } from "@/hooks/use-toast";
import {
  ALLOWED_IMAGE_EXTENSIONS_LABEL,
  MAX_IMAGE_MB,
  validateImageClientSide,
  type PropertyImage,
} from "@/lib/api/property-images";
import { api } from "@/lib/mock/api";

type PropertyImageManagerProps = {
  propertyId: string;
  canManage?: boolean;
  focusUpload?: boolean;
  onImagesChange?: (urls: string[]) => void;
};

function sortImages(rows: PropertyImage[]): PropertyImage[] {
  return rows.slice().sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
}

function mergeImages(prev: PropertyImage[], incoming: PropertyImage[]): PropertyImage[] {
  const byId = new Map<string, PropertyImage>();
  for (const img of prev) byId.set(img.id, img);
  for (const img of incoming) byId.set(img.id, img);
  return sortImages(Array.from(byId.values()));
}

function toResolvedUrls(rows: PropertyImage[]): string[] {
  return sortImages(rows).map((img) => resolveMediaUrl(img.url));
}

export function PropertyImageManager({
  propertyId,
  canManage = false,
  focusUpload = false,
  onImagesChange,
}: PropertyImageManagerProps) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [coveringId, setCoveringId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const onImagesChangeRef = useRef(onImagesChange);
  onImagesChangeRef.current = onImagesChange;

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.listPropertyImages(propertyId);
      setImages(rows);
    } catch (err) {
      toast({
        title: "No se pudieron cargar las fotos",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    setImages([]);
    void loadImages();
  }, [loadImages]);

  useEffect(() => {
    if (loading) return;
    onImagesChangeRef.current?.(toResolvedUrls(images));
  }, [images, loading]);

  useEffect(() => {
    if (focusUpload && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusUpload, loading]);

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!canManage || !fileList?.length) return;

    const files = Array.from(fileList);
    const clientRejected: string[] = [];
    const valid: File[] = [];

    for (const file of files) {
      const err = validateImageClientSide(file);
      if (err) clientRejected.push(`${file.name}: ${err}`);
      else valid.push(file);
    }

    if (clientRejected.length) {
      toast({
        title: "Algunos archivos no son válidos",
        description: clientRejected.slice(0, 3).join(" · "),
        variant: "destructive",
      });
    }
    if (!valid.length) return;

    setUploading(true);
    try {
      const result = await api.uploadPropertyImages(propertyId, valid);
      if (result.rejected.length) {
        toast({
          title: "Algunas fotos no se subieron",
          description: result.rejected.map((r) => `${r.filename}: ${r.reason}`).slice(0, 3).join(" · "),
          variant: "destructive",
        });
      }
      if (result.uploaded.length) {
        setImages((prev) => mergeImages(prev, result.uploaded));
        toast({
          title: result.uploaded.length === 1 ? "Foto agregada" : `${result.uploaded.length} fotos agregadas`,
          description: "La galería se actualizó.",
        });
      }
    } catch (err) {
      toast({
        title: "Error al subir",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleSetCover(imageId: string) {
    if (!canManage) return;
    setCoveringId(imageId);
    try {
      await api.setPropertyImageCover(propertyId, imageId);
      setImages((prev) => prev.map((img) => ({ ...img, isCover: img.id === imageId })));
      toast({ title: "Portada actualizada" });
    } catch (err) {
      toast({
        title: "No se pudo cambiar la portada",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setCoveringId(null);
    }
  }

  async function handleDelete(imageId: string) {
    if (!canManage) return;
    if (!window.confirm("¿Eliminar esta foto?")) return;

    setDeletingId(imageId);
    try {
      await api.deletePropertyImage(propertyId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast({ title: "Foto eliminada" });
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <section ref={sectionRef} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-primary" /> Fotos
        </h3>
        {!loading && (
          <span className="text-xs text-muted-foreground">
            {images.length} {images.length === 1 ? "foto" : "fotos"}
          </span>
        )}
      </div>

      {canManage && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-surface-muted/50",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Subiendo fotos…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <p className="text-sm font-medium text-foreground">Arrastra fotos aquí o haz clic para elegir</p>
              <p className="text-xs">
                {ALLOWED_IMAGE_EXTENSIONS_LABEL} · máx. {MAX_IMAGE_MB} MB por archivo
              </p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando galería…
        </div>
      ) : images.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          {canManage ? "Aún no hay fotos. Sube la primera para mostrar la propiedad." : "Esta propiedad aún no tiene fotos."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <li
              key={img.id}
              className={cn(
                "group relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted",
                img.isCover ? "border-primary ring-2 ring-primary/30" : "border-border",
              )}
            >
              <img
                src={resolveMediaUrl(img.url)}
                alt={img.originalFilename}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {img.isCover && (
                <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0" variant="secondary">
                  Portada
                </Badge>
              )}
              {canManage && (
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-end justify-center gap-1.5 p-2 opacity-0 group-hover:opacity-100">
                  {!img.isCover && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      disabled={coveringId === img.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleSetCover(img.id);
                      }}
                      aria-label="Marcar como portada"
                    >
                      {coveringId === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    disabled={deletingId === img.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(img.id);
                    }}
                    aria-label="Eliminar foto"
                  >
                    {deletingId === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
