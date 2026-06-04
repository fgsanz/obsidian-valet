Feature: Add value operation
  Adding a new value to a property, respecting whether the property allows
  multiple values, and never producing duplicates.

  Scenario: Append a link to a multi-value property
    Given a fresh copy of the dummy vault
    When I filter notes in directory "Projects"
    And I apply add-value on property "related" with value "[[ProjectZ]]"
    Then 3 notes are changed
    And note "Alpha" has "[[ProjectZ]]" in "related"
    And note "Beta" has "[[ProjectZ]]" in "related"
    And note "Alpha" has "[[Beta]]" in "related"
    And the YAML of "Beta" is still valid

  Scenario: Adding a value that already exists changes nothing
    Given a fresh copy of the dummy vault
    When I filter notes where "related" "contains" "[[Beta]]"
    And I apply add-value on property "related" with value "[[Beta]]"
    Then 1 notes match
    And 0 notes are changed

  Scenario: Adding to a populated single-value property is skipped
    Given a fresh copy of the dummy vault
    When I filter notes in directory "Areas"
    And I apply add-value on property "date" with value "2026-12-31"
    Then 1 notes match
    And 0 notes are changed
    And note "Health" has property "date" equal to "2026-03-01"
