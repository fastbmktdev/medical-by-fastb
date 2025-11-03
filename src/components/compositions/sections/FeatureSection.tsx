"use client";

import { Container } from "@/components/design-system/primitives/Container";
import { Card } from "@/components/design-system/primitives/Card";
import { FeatureSectionProps } from "./types";
import Image from "next/image";

export function FeatureSection({
  title,
  description,
  features,
  layout = "grid",
  columns = 3,
  className = "",
  testId = "feature-section",
  ...props
}: FeatureSectionProps) {
  const getGridColumns = () => {
    if (layout === "list") return "grid-cols-1";

    const colsMap = {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    };
    return colsMap[columns];
  };

  return (
    <section className={`py-16 ${className}`} data-testid={testId} {...props}>
      <Container>
        {/* Section Header */}
        {(title || description) && (
          <div className="text-center mb-12 max-w-3xl mx-auto">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {description && (
              <p className="text-xl text-zinc-400 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Features */}
        <div className={`grid ${getGridColumns()} gap-8`}>
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`p-6 ${layout === "list" ? "flex items-start gap-6" : "text-center"}`}
              data-testid={`${testId}-feature-${index}`}
            >
              {/* Icon or Image */}
              {(feature.icon || feature.image) && (
                <div
                  className={`${layout === "list" ? "flex-shrink-0" : "mb-4"}`}
                >
                  {feature.image ? (
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={200}
                      height={200}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className={`${layout === "list" ? "" : "flex justify-center"}`}
                    >
                      {feature.icon}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={layout === "list" ? "flex-1" : ""}>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
