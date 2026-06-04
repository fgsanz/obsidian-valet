Feature: Delete value operation
  Removing a specific value from a property across all matching notes,
  without corrupting the YAML frontmatter.

  Scenario: Remove a parent link from matching notes
    Given a fresh copy of the dummy vault
    When I filter notes where "parent" "contains" "[[ProjectX]]"
    And I apply delete-value on property "parent" with value "[[ProjectX]]"
    Then 2 notes are changed
    And 0 notes fail
    And note "Alpha" no longer has "[[ProjectX]]" in "parent"
    And note "Beta" no longer has "[[ProjectX]]" in "parent"
    And the YAML of "Alpha" is still valid

  Scenario: A non-matching note keeps its parent untouched
    Given a fresh copy of the dummy vault
    When I filter notes where "parent" "contains" "[[ProjectX]]"
    And I apply delete-value on property "parent" with value "[[ProjectX]]"
    Then note "Gamma" has "[[ProjectY]]" in "parent"
