# RBAC is now covered by the full integration test in test_m1_integration.py:
# - Admin can perform all actions
# - Campaign Manager can create/transition campaigns
# - Comms Team is blocked from campaign creation/transitions (403)
# - Comms Team CAN view campaigns and create templates
#
# See test_m1_integration.py::test_full_m1_flow for the complete flow.