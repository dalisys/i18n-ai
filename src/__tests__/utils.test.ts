import { flattenObject, unflattenObject } from "../utils/flatten";

describe("Utility Functions", () => {
  describe("flattenObject", () => {
    it("should flatten a nested object", () => {
      const input = {
        user: {
          name: "John",
          address: {
            street: "Main St",
            city: "Boston",
          },
        },
        settings: {
          theme: "dark",
        },
      };

      const expected = {
        "user.name": "John",
        "user.address.street": "Main St",
        "user.address.city": "Boston",
        "settings.theme": "dark",
      };

      expect(flattenObject(input)).toEqual(expected);
    });

    it("should handle arrays", () => {
      const input = {
        items: ["a", "b", "c"],
        nested: {
          array: [1, 2, 3],
        },
      };

      const expected = {
        "items.0": "a",
        "items.1": "b",
        "items.2": "c",
        "nested.array.0": "1",
        "nested.array.1": "2",
        "nested.array.2": "3",
      };

      expect(flattenObject(input)).toEqual(expected);
    });

    it("should handle empty objects", () => {
      expect(flattenObject({})).toEqual({});
    });
  });

  describe("unflattenObject", () => {
    it("should unflatten a flat object", () => {
      const input = {
        "user.name": "John",
        "user.address.street": "Main St",
        "user.address.city": "Boston",
        "settings.theme": "dark",
      };

      const expected = {
        user: {
          name: "John",
          address: {
            street: "Main St",
            city: "Boston",
          },
        },
        settings: {
          theme: "dark",
        },
      };

      expect(unflattenObject(input)).toEqual(expected);
    });

    it("should handle array indices", () => {
      const input = {
        "items.0": "a",
        "items.1": "b",
        "items.2": "c",
        "nested.array.0": "1",
        "nested.array.1": "2",
        "nested.array.2": "3",
      };

      const expected = {
        items: ["a", "b", "c"],
        nested: {
          array: [1, 2, 3],
        },
      };

      expect(unflattenObject(input)).toEqual(expected);
    });

    it("should handle empty objects", () => {
      expect(unflattenObject({})).toEqual({});
    });
  });
});
